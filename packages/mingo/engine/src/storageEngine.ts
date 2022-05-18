import { Iterator } from 'mingo/lazy';
import { Document, StorageEngine } from './interfaces';

export class MemoryStorageEngine implements StorageEngine {
  private indexes: {[coll: string]: Record<string, number>} = {};

  public constructor(
    public readonly databaseName: string,
    private collections: {[coll: string]: Document[] | {viewOn: string, pipeline: Document[]}} = {},
    public cursors: Record<string, Iterator> = {},
  ) {
    for (const collName in collections) {
      const coll = collections[collName];
      if (Array.isArray(coll)) {
        this.indexes[collName] = {};
        for (let i = 0; i < coll.length; i++) {
          this.indexes[collName][coll[i]._id] = i;
        }
      }
    }
  }

  public async create(collection: string) {
    this.collections[collection] = [];
    this.indexes[collection] = {};
  }

  public async drop(collection: string): Promise<void> {
    delete this.collections[collection];
    delete this.indexes[collection];
  }

  public async *collection(collection: string): AsyncGenerator<Document> {
    const coll = this.collections[collection];
    if (Array.isArray(coll)) {
      for (const doc of coll) {
        yield doc;
      }
    } else {
      // TODO: Views
      throw Error('Not implemented');
    }
  }

  public index(collection: string, id: string): number | undefined {
    return this.indexes[collection][id];
  }

  public async insert(collection: string, document: Document): Promise<void> {
    const coll = this.collections[collection];
    if (Array.isArray(coll)) {
      coll.push(document);
      this.indexes[collection][document._id] = coll.length - 1;
    }
  }

  public async delete(collection: string, id: string): Promise<void> {
    const index = this.indexes[collection][id];
    const coll = this.collections[collection];

    if (index !== undefined && Array.isArray(coll)) {
      coll.splice(index, 1);
      delete this.indexes[collection][id];
      for (const key in this.indexes[collection]) {
        if (this.indexes[collection][key] > index) {
          this.indexes[collection][key]--;
        }
      }
    }
  }

  public async replace(collection: string, id: string, document: Document): Promise<void> {
    const index = this.indexes[collection][id];
    const coll = this.collections[collection];

    if (index !== undefined && Array.isArray(coll)) {
      coll.splice(index, 1, document);
    }
  }

  public async flush(): Promise<void> {}
}
