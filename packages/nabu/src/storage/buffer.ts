import { MemoryStorage } from '@tashmet/memory';
import { Document, makeWriteChange } from '@tashmet/engine';

import { StreamProvider } from '../interfaces';
import { GeneratorPipe } from '../stream';
import { jsonParser, jsonSerializer } from '../operators/json';
import { yamlParser, yamlSerializer } from '../operators/yaml';

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

  protected resolveSerializer(extension: string): GeneratorPipe {
    switch (extension) {
      case 'json': return jsonSerializer();
      case 'yaml': return yamlSerializer();
    }
    throw new Error('Unknown format');
  }

  protected resolveParser(extension: string): GeneratorPipe {
    switch (extension) {
      case 'json': return jsonParser();
      case 'yaml': return yamlParser();
    }
    throw new Error('Unknown format');
  }
}
