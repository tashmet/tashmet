import { MemoryStorage } from '@tashmet/memory';
import { Document, makeWriteChange } from '@tashmet/engine';
import { StreamProvider } from '../interfaces.js';

export abstract class BufferStorage extends MemoryStorage {
  protected configs: Record<string, Document> = {};
  protected rLock: Promise<any> | undefined;

  constructor(
    databaseName: string,
    protected streamProvider: StreamProvider,
  ) { super(databaseName); }

  public drop(collection: string): Promise<void> {
    delete this.configs[collection];
    return super.drop(collection);
  }

  protected async populate(collection: string, stream: AsyncIterable<Document>): Promise<void> {
    for await (const doc of stream) {
      await super.write([makeWriteChange('insert', doc, {db: this.databaseName, coll: collection})], {ordered: false});
    }
  }

  public async *stream(collection: string): AsyncGenerator<Document> {
    if (this.rLock) {
      await this.rLock;
    }
    for await (const doc of super.stream(collection)) {
      yield doc;
    }
  }

  public async exists(collection: string, id: string): Promise<boolean> {
    if (this.rLock) {
      await this.rLock;
    }
    return super.exists(collection, id);
  }
}
