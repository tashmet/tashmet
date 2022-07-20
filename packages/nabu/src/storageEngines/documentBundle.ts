import { Document } from '@tashmet/engine';

import {
  DocumentBundleConfig,
  FileAccess,
} from '../interfaces';
import { Stream } from '../generators/stream';
import * as nodePath from 'path';
import { BufferStorageEngine } from './buffer';

export class DocumentBundleStorageEngine extends BufferStorageEngine {
  constructor(
    databaseName: string,
    fileAccess: FileAccess,
    private config: DocumentBundleConfig,
  ) { super(databaseName, fileAccess); }


  public async create(collection: string, options: Document): Promise<void> {
    const path = this.config.documentBundle(collection);
    const stream = new Stream(this.fileAccess.read(path));
    const serializer = this.resolveSerializer(this.config.format);

    await super.create(collection, options || {});
    this.configs[collection] = options.storageEngine;

    await this.populate(collection, stream.loadFiles({
      id: file => nodePath.basename(file.path).split('.')[0],
      serializer,
    }));
  }

  public async insert(collection: string, document: Document): Promise<void> {
    await super.insert(collection, document);

    const serializer = this.resolveSerializer(this.config.format);
    await this.fileAccess.write(Stream
      .fromArray([document])
      .createFiles({serializer, path: doc => this.config.documentBundle(collection, document._id)})
    );
  }

  public async replace(collection: string, id: string, document: Document): Promise<void> {
    await super.replace(collection, id, document);

    const serializer = this.resolveSerializer(this.config.format);
    await this.fileAccess.write(Stream
      .fromArray([document])
      .createFiles({serializer, path: doc => this.config.documentBundle(collection, id)})
    );
  }

  public async delete(collection: string, id: string): Promise<void> {
    await super.delete(collection, id);

    await this.fileAccess.write(Stream.fromArray([{
      path: this.config.documentBundle(collection, id),
      isDir: false,
    }]));
  }
}
