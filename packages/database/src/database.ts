import {Logger} from '@tashmit/core';
import {OperatorConfig} from '@tashmit/operators';
import {OperatorType, useOperators} from "mingo/core";
import {MemoryDriver} from './collections/memory';
import {withMiddleware, validation, readOnly, locked} from './middleware';
import {
  CollectionConfig,
  Database,
  OptionalId,
  ValidatorFactory,
} from './interfaces';
import {Collection} from './collection';
import {ChangeSet, ChangeStreamDocument, ViewCollectionConfig} from '.';


export class MemoryDatabase extends Database {
  private data: Record<string, MemoryDriver<any>> = {};

  public constructor(
    name: string,
    private logger: Logger,
    private validatorFactory: ValidatorFactory,
    operators: OperatorConfig = {},
  ) {
    super(name);
    const {accumulator, expression, pipeline, projection, query} = operators;

    useOperators(OperatorType.ACCUMULATOR, accumulator || {});
    useOperators(OperatorType.EXPRESSION, expression || {});
    useOperators(OperatorType.PIPELINE, pipeline || {});
    useOperators(OperatorType.PROJECTION, projection || {});
    useOperators(OperatorType.QUERY, query || {});
  }

  public collection(name: string): Collection {
    if (Object.keys(this.collections).includes(name)) {
      return this.collections[name];
    }
    return this.createCollection(name, {});
  }

  public createCollection<T = any>(
    name: string, config: CollectionConfig | ViewCollectionConfig): Collection<T>
  {
    try {
      if (name in this.collections) {
        throw new Error(`a collection named '${name}' already exists in database`);
      }

      const driver = MemoryDriver.fromConfig<T>({
        ns: {db: this.name, coll: name},
        collectionResolver: name => this.data[name].documents
      });
      let c: Collection<T>;

      if ('viewOf' in config) {
        c = this.createView(driver, config);
      } else {
        const validator = config.validator;
        c = new Collection<T>(driver);
        if (validator) {
          c = withMiddleware<T>(c, [validation(this.validatorFactory.create(validator))]);
        }
      }
      this.collections[name] = c;
      this.data[name] = driver;

      //c.on('change', change => this.emit('change', change));
      //c.on('error', error => this.emit('error', error));
      this.logger.inScope('createCollection').info(c.toString());
      return c;
    } catch (err) {
      this.logger.error(err.message);
      throw err;
    }
  }

  private createView<T = any>(driver: MemoryDriver<T>, config: ViewCollectionConfig) {
    const viewOf = this.collection(config.viewOf);
    const collection = new Collection<T>(driver);
    const cs = viewOf.watch();
    const populate = async () => collection.insertMany(
      await viewOf.aggregate<OptionalId<T>>(config.pipeline).toArray()
    );
    const locks: Promise<any>[] = [populate()];

    const handleChange = async (change: ChangeStreamDocument<any>) => {
      const newDocs = await viewOf.aggregate<T>(config.pipeline).toArray();
      const oldDocs = await collection.find({}).toArray();

      await collection.bulkWrite(ChangeSet.fromDiff(oldDocs, newDocs).toOperations());
    }

    cs.on('change', async change => {
      locks.push(handleChange(change));
    });
    return withMiddleware<T>(collection, [readOnly, locked(locks)]);
  }
}
