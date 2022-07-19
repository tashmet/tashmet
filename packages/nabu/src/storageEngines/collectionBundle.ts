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
    const stream = new Stream(this.fileAccess.read(config.path));

    await super.create(collection, options || {});
    this.configs[collection] = options.storageEngine;

    await this.populate(collection, stream.loadBundle(config));
  }

  public async insert(collection: string, document: Document): Promise<void> {
    await super.insert(collection, document);

    this.fileAccess.write(Stream
      .fromArray([document])
      .createBundle(this.bundleConfig(collection))
    );
  }

  private bundleConfig(collection: string): FileConfig {
    return {
      path: this.config.collectionBundle(collection),
      serializer: this.resolveSerializer(this.config.format),
      dictionary: this.config.dictionary,
    };
  }
}
