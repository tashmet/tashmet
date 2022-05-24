import {
  CreateCollectionOptions,
  Database,
  DatabaseFactory,
  Dispatcher,
  Document,
  Namespace,
  Store,
  StoreConfig,
  ValidatorFactory,
  ViewFactory,
} from './interfaces';
import {Collection} from './collection';
import {validation, withMiddleware} from './middleware';
import {Logger, provider, Optional} from '@tashmet/core';


/**
 * Abstract base class for databases
 */
export class DatabaseService implements Database {
  protected collMap: {[name: string]: Collection} = {};

  public constructor(
    public readonly databaseName: string,
    private logger: Logger,
    private dispatcher: Dispatcher,
    private validatorFactory: ValidatorFactory | undefined,
    private viewFactory: ViewFactory | undefined,
  ) {}

  public collection(name: string): Collection {
    if (name in this.collMap) {
      return this.collMap[name];
    }
    return this.createCollection(name);
  }

  public collections() {
    return Object.values(this.collMap);
  }

  public createCollection<T extends Document = any>(
    name: string, options: CreateCollectionOptions = {}): Collection<T>
  {
    try {
      if (name in this.collMap) {
        throw new Error(`a collection named '${name}' already exists in database`);
      }
      const ns: Namespace = {db: this.databaseName, coll: name};

      this.dispatcher.dispatch(ns, {create: name, ...options});

      let store: Store<T>;
      const storeConfig: StoreConfig = {
        ns: {db: this.databaseName, coll: name},
        collation: options.collation,
        options: options.storageEngine,
      }

      //const {viewOf, pipeline} = options;
/*
      if (viewOf && pipeline) {
        if (this.viewFactory) {
          store = this.viewFactory.createView(storeConfig, this.collMap[viewOf], pipeline);
        } else {
          throw new Error('Failed to create view, no ViewFactory was registered')
        }
      } else {
        const validator = options.validator;
        //store = this.engine.createStore<T>(storeConfig);
        if (validator) {
          if (this.validatorFactory) {
            store = withMiddleware<T>(store, [validation(this.validatorFactory.create(validator))]);
          } else {
            this.logger.warn('No ValidatorFactory registered, validation will be disabled');
          }
        }
      }
      */
      const c = new Collection<T>(name, this.dispatcher, this);
      this.collMap[name] = c;
      //this.engine.register(store);

      this.logger.inScope('createCollection').info(c.toString());
      return c;
    } catch (err) {
      this.logger.error(err.message);
      throw err;
    }
  }

  public async dropCollection(name: string) {
    //const ns = {db: this.databaseName, coll: name};
    /*
    const store = this.engine.get(ns);

    if (!store) {
      return false;
    }
    // await store.write(ChangeSet.fromDelete(await store.find({}).toArray()));
    */
    await this.dispatcher.dispatch({db: this.databaseName, coll: name}, {drop: name});
    /*
    store.emit('change', {
      _id: new ObjectId(),
      operationType: 'drop',
      ns: store.ns,
    });
    delete this.collMap[name];
    this.engine.drop(ns);
    */

    return true;
  }
}

@provider({
  key: DefaultDatabaseFactory,
  inject: [
    Logger,
    Dispatcher,
    Optional.of(ValidatorFactory),
    Optional.of(ViewFactory),
  ]
})
export class DefaultDatabaseFactory implements DatabaseFactory {
  public constructor(
    private logger: Logger,
    private dispatcher: Dispatcher,
    private validatorFactory: ValidatorFactory | undefined,
    private viewFactory: ViewFactory | undefined,
  ) {}

  createDatabase(name: string): Database {
    return new DatabaseService(name, this.logger, this.dispatcher, this.validatorFactory, this.viewFactory);
  }
}
