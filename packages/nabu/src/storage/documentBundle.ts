import { ChangeStreamDocument, Document, WriteOptions } from '@tashmet/engine';

import {
  DocumentBundleConfig,
  FileAccess,
} from '../interfaces';
import { Stream } from '../generators/stream';
import * as nodePath from 'path';
import { BufferStorage } from './buffer';

export class DocumentBundleStorage extends BufferStorage {
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

  public async write(changes: ChangeStreamDocument<Document>[], options: WriteOptions) {
    const writeErrors = await super.write(changes, options);
    const serializer = this.resolveSerializer(this.config.format);

    const stream = Stream.fromArray(changes).createFiles({
      path: c => this.config.documentBundle(c.ns.coll, c.documentKey._id),
      serializer,
      content: c => c.operationType === 'delete' ? undefined : c.fullDocument,
    });

    await this.fileAccess.write(stream);

    return writeErrors;
  }
}
