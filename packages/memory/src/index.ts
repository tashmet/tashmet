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
  AggregationReadController,
  AggregationWriteController,
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
  WriteOptions,
  StreamOptions,
  DocumentAccess
} from '@tashmet/engine';
import {
  Dispatcher,
  ChangeStreamDocument,
} from '@tashmet/bridge';

function hash(value: string | object): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

export class MemoryCollection implements AtomicWriteCollection {
  public indexes: Map<string, number> = new Map();

  public constructor(
    public readonly name: string,
    public documents: Document[] = [],
    public readonly rules: Document = {},
    private readonly validatorFact: ValidatorFactory | undefined,
  ) {
    for (let i = 0; i < documents.length; i++) {
      this.indexes.set(documents[i]._id, i);
    }
  }

  public exists(id: string | Object): boolean {
    return this.indexes.has(hash(id));
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
    this.indexes.set(hash(document._id), this.documents.length - 1);
  }

  public async delete(id: string): Promise<void> {
    const index = this.indexes.get(hash(id));

    if (index !== undefined) {
      this.documents.splice(index, 1);
      this.indexes.delete(hash(id));
      for (const [k, v] of this.indexes) {
        if (v > index) {
          this.indexes.set(k, v - 1);
        }
      }
    }
  }

  public async replace(id: string, document: Document): Promise<void> {
    const index = this.indexes.get(hash(id));

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

  public async *stream(collection: string, options?: StreamOptions): AsyncGenerator<Document> {
    const coll = this.collections[collection];
    if (coll) {
      if (options?.documentIds) {
        for (const id of options.documentIds) {
          if (coll.exists(id)) {
            yield coll.documents[coll.indexes.get(hash(id)) || 0];
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
  inject: [AggregatorFactory, DocumentAccess, Logger, Optional.of(ValidatorFactory)]
})
@plugin<any>()
export default class MemoryStorageEngineFactory extends StorageEngineFactory {
  public constructor(
    private aggFact: AggregatorFactory,
    private documentAccess: DocumentAccess,
    private logger: Logger,
    private validatorFact?: ValidatorFactory,
  ) { super(); }

  public static configure(config: Partial<BootstrapConfig>, container?: Container) {
    return new MemoryConfigurator(MemoryStorageEngineFactory, config, container);
  }

  public createStorageEngine(dbName: string): StorageEngine {
    const storage = new MemoryStorage(dbName, undefined, this.validatorFact);
    const engine = new AggregationEngine(this.aggFact, new QueryPlanner(this.documentAccess, this.logger), dbName);
    const views: ViewMap = {};
    this.documentAccess.addStreamable(dbName, storage);
    this.documentAccess.addWritable(dbName, storage);
    this.documentAccess.addRegistry(dbName, storage);
    return StorageEngine.fromControllers(dbName,
      new AdminController(dbName, storage, views),
      new AggregationReadController(dbName, engine, views),
      new AggregationWriteController(dbName, storage, engine)
    );
  }
}

export class MemoryConfigurator extends PluginConfigurator<StorageEngineFactory, any> {
  public register() {
    this.container.register(Provider.ofResolver(StorageEngineFactory, Lookup.of(MemoryStorageEngineFactory)));

    if (!this.container.isRegistered(Dispatcher)) {
      this.container.register(Dispatcher);
    }

    if (!this.container.isRegistered(DocumentAccess)) {
      this.container.register(DocumentAccess);
    }
  }

  public load() {
    const fact = this.container.resolve(MemoryStorageEngineFactory);
    this.container.resolve(Dispatcher).addBridge('*', new StorageEngineBridge(fact));
  }
}
