import { MemoryStorage } from '@tashmet/memory';
import { Document, makeWriteChange } from '@tashmet/engine';
import { StreamProvider } from '../interfaces';

export abstract class BufferStorage extends MemoryStorage {
  protected configs: Record<string, Document> = {};

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
}
