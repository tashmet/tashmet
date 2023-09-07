import {
  provider,
  Provider,
  Lookup,
  Optional,
  Logger,
  plugin,
  BootstrapConfig,
  PluginConfigurator,
  Container
} from '@tashmet/core';
import {
  AdminController,
  AggregationController,
  AggregationEngine,
  AggregatorFactory,
  AtomicWriteCollection,
  CollectionRegistry,
  Document,
  QueryPlanner,
  sequentialWrite,
  StorageEngineBridge,
  StorageEngine,
  StorageEngineFactory,
  Streamable,
  ValidatorFactory,
  ViewMap,
  Writable,
  WriteOptions
} from '@tashmet/engine';
import {
  Dispatcher,
  ChangeStreamDocument,
} from '@tashmet/bridge';

export class MemoryCollection implements AtomicWriteCollection {
  public indexes: Record<string, number> = {};

  public constructor(
    public readonly name: string,
    public documents: Document[] = [],
    public readonly rules: Document = {},
    private readonly validatorFact: ValidatorFactory | undefined,
  ) {
    for (let i = 0; i < documents.length; i++) {
      this.indexes[documents[i]._id] = i;
    }
  }

  public exists(id: string): boolean {
    return this.indexes[id] !== undefined;
  }

  public async insert(document: Document): Promise<void> {
    if (this.rules && this.validatorFact) {
      const validator = this.validatorFact.createValidator(this.rules);
      if (!validator(document)) {
        throw new Error('validation failed');
      }
    }
    if (await this.exists(document._id)) {
      throw new Error('Duplicate id');
    }

    this.documents.push(document);
    this.indexes[document._id] = this.documents.length - 1;
  }

  public async delete(id: string): Promise<void> {
    const index = this.indexes[id];

    if (index !== undefined) {
      this.documents.splice(index, 1);
      delete this.indexes[id];
      for (const key in this.indexes) {
        if (this.indexes[key] > index) {
          this.indexes[key]--;
        }
      }
    }
  }

  public async replace(id: string, document: Document): Promise<void> {
    const index = this.indexes[id];

    if (index !== undefined) {
      this.documents.splice(index, 1, document);
    }
  }
}

export class MemoryStorage implements CollectionRegistry, Streamable, Writable {
  private collections: Record<string, MemoryCollection> = {};

  public constructor(
    public readonly databaseName: string,
    collections: {[coll: string]: Document[]} = {},
    private validatorFact: ValidatorFactory | undefined = undefined,
  ) {
    for (const collName in collections) {
      this.collections[collName] = new MemoryCollection(collName, collections[collName], {}, validatorFact)
    }
  }

  public async create(collection: string, {validator}: Document) {
    if (!this.collections[collection]) {
      this.collections[collection] = new MemoryCollection(collection, [], validator, this.validatorFact);
    }
  }

  public async drop(collection: string): Promise<void> {
    delete this.collections[collection];
  }

  public async *stream(collection: string, documentIds?: string[]): AsyncGenerator<Document> {
    const coll = this.collections[collection];
    if (coll) {
      if (documentIds) {
        for (const id of documentIds) {
          if (coll.exists(id)) {
            yield coll.documents[coll.indexes[id]];
          }
        }
      } else {
        for (const doc of coll.documents) {
          yield doc;
        }
      }
    } else {
      throw Error(`Collection ${collection} does not exist`);
    }
  }

  public async exists(collection: string, id: string): Promise<boolean> {
    const coll = this.collections[collection];
    return coll && coll.exists(id);
  }

  public async write(changes: ChangeStreamDocument[], {ordered}: WriteOptions) {
    return sequentialWrite(this.collections, changes, ordered);
  }

  public resolve(collection: string): Document[] {
    return this.collections[collection].documents;
  }
}



@provider({
  inject: [AggregatorFactory, Logger, Optional.of(ValidatorFactory)]
})
@plugin<any>()
export default class MemoryStorageEngineFactory extends StorageEngineFactory {
  public constructor(
    private aggFact: AggregatorFactory,
    private logger: Logger,
    private validatorFact?: ValidatorFactory,
  ) { super(); }

  public static configure(config: Partial<BootstrapConfig>, container?: Container) {
    return new MemoryConfigurator(MemoryStorageEngineFactory, config, container);
  }

  public createStorageEngine(dbName: string): StorageEngine {
    const storage = new MemoryStorage(dbName, undefined, this.validatorFact);
    const engine = new AggregationEngine(this.aggFact, new QueryPlanner(storage, this.logger.inScope('QueryPlanner')), {
      collectionResolver: (name: string) => storage.resolve(name),
    });
    const views: ViewMap = {};
    return StorageEngine.fromControllers(dbName,
      new AdminController(dbName, storage, views),
      new AggregationController(dbName, storage, engine, views)
    );
  }
}

export class MemoryConfigurator extends PluginConfigurator<StorageEngineFactory, any> {
  public register() {
    this.container.register(Provider.ofResolver(StorageEngineFactory, Lookup.of(MemoryStorageEngineFactory)));

    if (!this.container.isRegistered(Dispatcher)) {
      this.container.register(Dispatcher);
    }
  }

  public load() {
    const fact = this.container.resolve(MemoryStorageEngineFactory);
    this.container.resolve(Dispatcher).addBridge('*', new StorageEngineBridge(fact));
  }
}
