import { Document } from '@tashmet/engine';

import { CollectionBundleConfig, FileAccess, FileConfig } from '../interfaces';
import { Stream } from '../generators/stream';
import { BufferStorageEngine } from './buffer';


export class CollectionBundleStorageEngine extends BufferStorageEngine {
  constructor(
    databaseName: string,
    fileAccess: FileAccess,
    private config: CollectionBundleConfig,
  ) { super(databaseName, fileAccess); }

  public async create(collection: string, options: Document): Promise<void> {
    const config = this.bundleConfig(collection);

    await super.create(collection, options || {});
    this.configs[collection] = options.storageEngine;

    try {
      //const stream = new Stream(this.fileAccess.read(config.path));
      //await this.populate(collection, stream.loadBundle(config));
    } catch (err) {
      // File not found, do nothing
    }
  }

  public async insert(collection: string, document: Document): Promise<void> {
    await super.insert(collection, document);
    await this.persistCollection(collection);
  }

  public async delete(collection: string, id: string): Promise<void> {
    await super.delete(collection, id);
    await this.persistCollection(collection);
  }

  public async replace(collection: string, id: string, document: Document): Promise<void> {
    await super.replace(collection, id, document);
    await this.persistCollection(collection);
  }

  private bundleConfig(collection: string): FileConfig {
    return {
      path: this.config.collectionBundle(collection),
      serializer: this.resolveSerializer(this.config.format),
      dictionary: this.config.dictionary,
    };
  }

  private async persistCollection(collection: string): Promise<void> {
    const docs = this.resolve(collection);

    const stream = docs.length > 0
      ? Stream
        .fromArray(docs)
        .createBundle(this.bundleConfig(collection))
      : Stream.fromArray([{
        path: this.config.collectionBundle(collection),
        isDir: false,
      }]);
    return this.fileAccess.write(stream);
  }
}
