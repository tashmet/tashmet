import { Document, StorageEngine } from '@tashmet/engine';
import { HttpRestLayer } from './common';

export class HttpStorageEngine implements StorageEngine {
  private collections: Record<string, string> = {};

  public constructor(
    public readonly databaseName: string,
    public restLayer: HttpRestLayer,
  ) {}

  public async create(collection: string, options: Document): Promise<void> {
    if (this.collections[collection]) {
      throw new Error(`Collection ${collection} already exists`);
    } else {
      this.collections[collection] = options?.storageEngine?.path || collection;
    }
  }

  public async drop(collection: string): Promise<void> {
    if (this.collections[collection]) {
      delete this.collections[collection];
    } else {
      throw new Error(`Collection ${collection} does not exist`);
    }
  }

  public async insert(collection: string, doc: Document): Promise<void> {
    const result = await this.restLayer.post(collection, doc);
    Object.assign(doc, {_id: result.insertedId});
    return result;
  }

  public async delete(collection: string, id: string): Promise<void> {
    await this.restLayer.delete(collection, id);
  }

  public async replace(collection: string, id: string, doc: Document): Promise<void> {
    await this.restLayer.put(collection, doc, id);
  }

  public async exists(collection: string, id: string): Promise<boolean> {
    // TODO: Do a HEAD request
    return false;
  }
}
