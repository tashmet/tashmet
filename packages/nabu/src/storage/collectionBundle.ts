import { ChangeStreamDocument, Document, WriteOptions } from '@tashmet/engine';

import { CollectionBundleConfig, StreamProvider } from '../interfaces.js';
import { clone } from '../operators/common.js';
import { BufferStorage } from './buffer.js';

export function loadBundle(dictionary: boolean = false): Document[] {
  return dictionary
    ? [
      {$project: { documents: { $objectToArray: "$content" } } },
      {$unwind: "$documents" },
      {$set: { 'documents.v._id': '$documents.k' }},
      {$replaceRoot: {newRoot: '$documents.v'}},
    ] : [
      {$unwind: "$content" },
      {$replaceRoot: {newRoot: '$content'}}
    ];
}

export function createBundle(path: string, dictionary: boolean = false): Document[] {
  return dictionary
    ? [
      {$project: {k: '$_id', v: '$$ROOT', 'v._id': 0, group: 'group', _id: 0}},
      {$group: {_id: 'group', content: {$push: {k: '$k', v: '$v'}}}},
      {$project: {_id: 0, path, content: {$arrayToObject: '$content'}}},
      {$set: {isDir: false}},
    ] : [
      {$group: {_id: 1, content: {$push: '$$ROOT'}}},
      {$project: {_id: 0, path, content: 1}},
      {$set: {isDir: false}},
    ];
}

export class CollectionBundleStorage extends BufferStorage {
  constructor(
    databaseName: string,
    streamProvider: StreamProvider,
    private config: CollectionBundleConfig,
  ) { super(databaseName, streamProvider); }

  public async create(collection: string, options: Document): Promise<void> {
    await super.create(collection, options || {});
    this.configs[collection] = options.storageEngine;

    try {
      /*
      const stream = this.streamProvider.read(this.config.collectionBundle(collection))
        .pipe(loadBundle(this.config.dictionary))
      await this.populate(collection, stream);
      */
    } catch (err) {
      // File not found, do nothing
    }
  }

  public async write(changes: ChangeStreamDocument<Document>[], options: WriteOptions) {
    const res = await super.write(changes, options);
    const collections = new Set(changes.map(c => c.ns.coll));
    for (const c of [...collections]) {
      await this.persistCollection(c);
    }
    return res;
  }

  private async persistCollection(collection: string): Promise<void> {
    const docs = this.resolve(collection);

    if (docs.length > 0) {
      return this.streamProvider
        .source(docs)
        .pipe(clone())
        .pipe(createBundle(
          this.config.collectionBundle(collection),
          this.config.dictionary
        ))
        .write();
    } else {
      return this.streamProvider
      .source([{
        path: this.config.collectionBundle(collection),
        isDir: false,
      }])
      .write();
    }
  }
}
