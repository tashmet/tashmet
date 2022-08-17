import { AtomicWriteCollection, Document, sequentialWrite, StorageEngine, Streamable, ValidatorFactory, WriteOptions } from '@tashmet/engine';
import { ChangeStreamDocument } from '@tashmet/tashmet';

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


export class MemoryStorageEngine implements StorageEngine, Streamable {
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
      // TODO: Views
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
