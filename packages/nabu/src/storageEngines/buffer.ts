import { MemoryStorageEngine } from '@tashmet/mingo-engine';
import { Document } from '@tashmet/engine';

import { FileAccess, Transform } from '../interfaces';
import { yaml } from '../operators/yaml';
import { json } from '../operators/json';

export abstract class BufferStorageEngine extends MemoryStorageEngine {
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
      await super.insert(collection, doc);
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
