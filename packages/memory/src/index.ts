import {
  provider,
  Optional,
  PluginConfigurator,
  BootstrapConfig,
  createContainer,
  LogLevel
} from '@tashmet/core';
import {
  AdminController,
  AggregationReadController,
  AggregationWriteController,
  AggregationEngine,
  AtomicWriteCollection,
  CollectionRegistry,
  QueryPlanner,
  sequentialWrite,
  DatabaseEngine,
  Streamable,
  ValidatorFactory,
  ViewMap,
  Writable,
  WriteOptions,
  StreamOptions,
  DocumentAccess,
  StorageEngine
} from '@tashmet/engine';
import {
  ChangeStreamDocument,
  Document,
  Namespace,
} from '@tashmet/tashmet';

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
  inject: [AggregationEngine, DocumentAccess, Optional.of(ValidatorFactory)]
})
export default class Memory extends StorageEngine {
  private engines: Record<string, DatabaseEngine> = {};

  public constructor(
    private engine: AggregationEngine,
    private documentAccess: DocumentAccess,
    private validatorFact?: ValidatorFactory,
  ) { super(); }

  public static configure(config: Partial<BootstrapConfig>) {
    return new MemoryConfigurator(Memory, createContainer({logLevel: LogLevel.None, ...config}));
  }

  public createDatabaseEngine(dbName: string): DatabaseEngine {
    const storage = new MemoryStorage(dbName, undefined, this.validatorFact);
    const views: ViewMap = {};
    this.documentAccess.addStreamable(dbName, storage);
    this.documentAccess.addWritable(dbName, storage);
    this.documentAccess.addRegistry(dbName, storage);
    return DatabaseEngine.fromControllers(dbName,
      new AdminController(dbName, storage, views),
      new AggregationReadController(dbName, this.engine, views),
      new AggregationWriteController(dbName, storage, this.engine)
    );
  }

  public command(ns: Namespace, command: Document): Promise<Document> {
    if (!this.engines[ns.db]) {
      const store = this.createDatabaseEngine(ns.db);
      store.on('change', change => this.emit('change', change));
      this.engines[ns.db] = store;
    }
    return this.engines[ns.db].command(command);
  }
}

export class MemoryConfigurator extends PluginConfigurator<Memory> {
  public register() {
    this.container.register(Memory);
    this.container.register(AggregationEngine);
    this.container.register(QueryPlanner);

    if (!this.container.isRegistered(DocumentAccess)) {
      this.container.register(DocumentAccess);
    }
  }
}
