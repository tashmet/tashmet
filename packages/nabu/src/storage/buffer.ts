import { MemoryStorage } from '@tashmet/memory';
import { Document, makeWriteChange } from '@tashmet/engine';

import { FileAccess, Transform } from '../interfaces';
import { yaml } from '../operators/yaml';
import { json } from '../operators/json';

export abstract class BufferStorage extends MemoryStorage {
  protected configs: Record<string, Document> = {};

  constructor(
    databaseName: string,
    protected fileAccess: FileAccess,
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

  protected resolveSerializer(extension: string): Transform {
    switch (extension) {
      case 'json': return json('utf8');
      case 'yaml': return yaml('utf8');
    }
    throw new Error('Unknown format');
  }
}
