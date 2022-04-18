import { Iterator } from 'mingo/lazy';
import { Document, StorageEngine } from './interfaces';

export class MemoryStorageEngine implements StorageEngine {
  private indexes: {[coll: string]: Record<string, number>} = {};

  public constructor(
    public readonly databaseName: string,
    private collections: {[coll: string]: Document[]} = {},
    public cursors: Record<string, Iterator> = {},
  ) {
    for (const collection in collections) {
      this.indexes[collection] = {};
      for (let i = 0; i < collections[collection].length; i++) {
        this.indexes[collection][collections[collection][i]._id] = i;
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

  public documents(collection: string): Document[] {
    return this.collections[collection];
  }

  public index(collection: string, id: string): number | undefined {
    return this.indexes[collection][id];
  }

  public async insert(collection: string, document: Document): Promise<void> {
    this.collections[collection].push(document);
    this.indexes[collection][document._id] = this.collections[collection].length - 1;
  }

  public async delete(collection: string, id: string): Promise<void> {
    const index = this.indexes[collection][id];
    if (index !== undefined) {
      this.collections[collection].splice(index, 1);
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
    if (index !== undefined) {
      this.collections[collection].splice(index, 1, document);
    }
  }

  public async flush(): Promise<void> {}
}

export class MingoCursorRegistry {
  private cursors: Record<string, Iterator> = {};

  public get(id: string): Iterator {
    return this.cursors[id];
  }

  public set(id: string, cursor: Iterator) {
    this.cursors[id] = cursor;
  }

  public close(id: string) {
    delete this.cursors[id];
  }
}
