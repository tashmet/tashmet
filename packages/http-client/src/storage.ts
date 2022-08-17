import { AtomicWriteCollection, ChangeStreamDocument, Document, sequentialWrite, StorageEngine, Streamable, WriteError, WriteOptions } from '@tashmet/engine';
import { HttpRestLayer } from './interfaces';

export class HttpCollection implements AtomicWriteCollection {
  public constructor(public readonly name: string, private restLayer: HttpRestLayer) {}

  public async insert(doc: Document) {
    await this.restLayer.post(this.name, doc);
  }

  public async replace(id: string, doc: Document) {
    await this.restLayer.put(this.name, doc, id);
  }

  public async delete(id: string) {
    await this.restLayer.delete(this.name, id);
  }
}

export class HttpStorageEngine implements StorageEngine, Streamable {
  private collections: Record<string, HttpCollection> = {};

  public constructor(
    public readonly databaseName: string,
    public restLayer: HttpRestLayer,
  ) {}

  public async create(collection: string, options: Document): Promise<void> {
    if (this.collections[collection]) {
      throw new Error(`Collection ${collection} already exists`);
    } else {
      //this.collections[collection] = options?.storageEngine?.path || collection;
      this.collections[collection] = new HttpCollection(collection, this.restLayer);
    }
  }

  public async drop(collection: string): Promise<void> {
    if (this.collections[collection]) {
      delete this.collections[collection];
    } else {
      throw new Error(`Collection ${collection} does not exist`);
    }
  }

  public async write(changes: ChangeStreamDocument<Document>[], options?: WriteOptions | undefined): Promise<WriteError[]> {
    return sequentialWrite(this.collections, changes, !!options?.ordered);
  }

  public async *stream(collection: string): AsyncIterable<Document> {
    const resp = await this.restLayer.get(collection);
    for (const doc of resp.json()) {
      yield doc;
    }
  }

  public async exists(collection: string, id: string): Promise<boolean> {
    // TODO: Do a HEAD request
    return false;
  }
}
