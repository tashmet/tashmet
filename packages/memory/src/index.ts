import { provider, Container, Provider, Lookup, Optional } from '@tashmet/core';
import {
  AdminController,
  AggregationController,
  AggregationEngine,
  AggregatorFactory,
  AtomicWriteCollection,
  ChangeStreamDocument,
  CollectionRegistry,
  Document,
  sequentialWrite,
  StorageEngine,
  StorageEngineFactory,
  Streamable,
  ValidatorFactory,
  ViewMap,
  Writable,
  WriteOptions
} from '@tashmet/engine';

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
    this.collections[collection] = new MemoryCollection(collection, [], validator, this.validatorFact);
  }

  public async drop(collection: string): Promise<void> {
    delete this.collections[collection];
  }

  public async *stream(collection: string): AsyncGenerator<Document> {
    const coll = this.collections[collection];
    if (coll) {
      for (const doc of coll.documents) {
        yield doc;
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
  inject: [AggregatorFactory, Optional.of(ValidatorFactory)]
})
export default class MemoryStorageEngineFactory extends StorageEngineFactory {
  public static configure(config: Partial<any> = {}) {
    return (container: Container) => {
      container.register(MemoryStorageEngineFactory);
      container.register(Provider.ofResolver(StorageEngineFactory, Lookup.of(MemoryStorageEngineFactory)));
    }
  }

  public constructor(
    private aggFact: AggregatorFactory,
    private validatorFact?: ValidatorFactory,
  ) { super(); }

  public createStorageEngine(dbName: string): StorageEngine {
    const storage = new MemoryStorage(dbName, undefined, this.validatorFact);
    const engine = new AggregationEngine(this.aggFact, storage, {
      collectionResolver: (name: string) => storage.resolve(name),
    });
    const views: ViewMap = {};
    return StorageEngine.fromControllers(dbName,
      new AdminController(dbName, storage, views),
      new AggregationController(dbName, storage, engine, views)
    );
  }
}
