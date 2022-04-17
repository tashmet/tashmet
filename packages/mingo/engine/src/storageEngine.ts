import { Iterator } from 'mingo/lazy';
import { Document, StorageEngine } from './interfaces';

export class MemoryStorageEngine implements StorageEngine {
  public constructor(
    public readonly databaseName: string,
    private collections: {[coll: string]: Document[]} = {},
    public cursors: Record<string, Iterator> = {},
  ) {}

  public async create(collection: string) {
    this.collections[collection] = [];
  }

  public async drop(collection: string): Promise<void> {
    delete this.collections[collection];
  }

  public documents(collection: string): Document[] {
    return this.collections[collection];
  }

  public async insert(collection: string, document: Document): Promise<void> {
    this.collections[collection].push(document);
  }

  public async delete(collection: string, id: string): Promise<void> {
    this.collections[collection] = this.collections[collection].filter(o => o._id !== id);
  }

  public async replace(collection: string, id: string, document: Document): Promise<void> {
    const index = this.documents(collection).findIndex(o => o._id === id);
    this.collections[collection].splice(index, 1, document);
  }

  public async flush(): Promise<void> {
  }

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
