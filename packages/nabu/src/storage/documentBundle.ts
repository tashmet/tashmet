import { CollectionRegistry, Document, Streamable, StreamOptions, Writable, WriteOptions } from '@tashmet/engine';
import { ChangeStreamDocument } from '@tashmet/bridge';

import {
  DocumentBundleConfig,
  File,
  StreamProvider,
} from '../interfaces.js';
import * as nodePath from 'path';
import { clone } from '../operators/common.js';


export function loadFiles(id: Document | ((file: File<Document>) => string)): Document[] {
  if (typeof id === 'function') {
    id = { $function: { body: id, args: [ "$$ROOT" ], lang: "js" }};
  }

  return [
    {$set: { 'content._id': id }},
    {$replaceRoot: {newRoot: '$content'}}
  ];
}

export function createFiles(
  path: Document | ((doc: Document) => string),
  content?: string | ((doc: Document) => string | Document)
): Document[] {
  const c = content || '$$ROOT';

  return [
    { $project: {
      _id: 0,
      overwrite: {
        $cond: {
            if: { $eq: [ "insert", "$operationType" ] },
            then: false,
            else: true,
        }
      },
      path: { $function: { body: path, args: [ "$$ROOT" ], lang: "js" }},
      content: typeof c === 'function'
        ? { $function: { body: c, args: [ "$$ROOT" ], lang: "js" }}
        : c }
    },
    { $set: {isDir: false} },
  ];
}

export class DocumentBundleStorage implements CollectionRegistry, Streamable, Writable {
  protected configs: Record<string, Document> = {};

  constructor(
    public readonly databaseName: string,
    private streamProvider: StreamProvider,
    private config: DocumentBundleConfig,
  ) {}


  public async create(collection: string, options: Document): Promise<void> {
    this.configs[collection] = options.storageEngine;
  }

  public async drop(collection: string): Promise<void> {
    delete this.configs[collection];
  }

  public write(changes: ChangeStreamDocument<Document>[], options: WriteOptions) {
    return this.streamProvider.source(changes)
      .pipe(clone())
      .pipe(createFiles(
        c => this.config.documentBundle(c.ns.coll, c.documentKey._id),
        c => c.operationType === 'delete' ? undefined : c.fullDocument,
      ))
      .write();
  }

  public async *stream(collection: string, { documentIds, projection }: StreamOptions): AsyncIterable<Document> {
    const paths = documentIds
      ? documentIds.map(id => this.config.documentBundle(collection, id))
      : [this.config.documentBundle(collection)];

    for (const path of paths) {
      const stream = this.streamProvider.source(path, { content: projection?._id !== 1})
        .pipe(loadFiles(file => nodePath.basename(file.path).split('.')[0]));
      for await (const doc of stream) {
        yield doc;
      }
    }
  }
}
