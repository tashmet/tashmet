import { MemoryStorageEngine } from '@tashmet/mingo-engine';
import { Document, StorageEngine, Streamable } from '@tashmet/engine';

import { FileAccess, Transform } from './interfaces';
import { yaml } from './operators/yaml';
import { json } from './operators/json';
import { Stream } from './generators/stream';

export class FileBufferStorageEngine implements StorageEngine, Streamable {
  private collections: Record<string, Document> = {};

  constructor(
    public readonly databaseName: string,
    private buffer: MemoryStorageEngine,
    private fileAccess: FileAccess,
  ) {}

  public async create(collection: string, options: Document): Promise<void> {
    const {path, dictionary} = options.storageEngine;

    if (!path) {
      throw new Error('Path is required');
    }

    const stream = new Stream(this.fileAccess.read(path));
    const serializer = this.resolveSerializer(path);
    let docStream = path.includes('*')
      ? stream.loadFiles({ id: file => file.path, serializer })
      : stream.loadBundle({ path, serializer, dictionary});

    await this.buffer.create(collection, options);
    this.collections[collection] = options.storageEngine;

    for await (const doc of docStream) {
      await this.buffer.insert(collection, doc);
    }
  }

  public drop(collection: string): Promise<void> {
    delete this.collections[collection];
    return this.buffer.drop(collection);
  }

  public insert(collection: string, document: Document): Promise<void> {
    const config = this.collections[collection];

    if (!config) {
      throw new Error(`Collection ${collection} does not exist`);
    }

    const serializer = this.resolveSerializer(config.path);

    if (config.path && config.path.includes('*')) {
      Stream
        .fromArray([document])
        .createFiles({serializer, path: config.path})
        //.write();
    }

    return this.buffer.insert(collection, document);
  }

  public delete(collection: string, id: string): Promise<void> {
    return this.buffer.delete(collection, id);
  }

  public replace(collection: string, id: string, document: Document): Promise<void> {
    return this.buffer.replace(collection, id, document);
  }

  public exists(collection: string, id: string): Promise<boolean> {
    return this.buffer.exists(collection, id);
  }

  public stream(collection: string): AsyncIterable<Document> {
    return this.buffer.stream(collection);
  }

  private resolveSerializer(path: string): Transform {
    return path.endsWith('.json') ? json('utf8') : yaml('utf8');
  }
}
