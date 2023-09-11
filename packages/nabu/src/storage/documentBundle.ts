import { CollectionRegistry, Document, Streamable, Writable, WriteOptions } from '@tashmet/engine';
import { ChangeStreamDocument } from '@tashmet/bridge';

import {
  DocumentBundleConfig,
  File,
  StreamProvider,
} from '../interfaces.js';
import * as nodePath from 'path';
import { BufferStorage } from './buffer.js';
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
  protected rLock: Promise<any> | undefined;
  protected configs: Record<string, Document> = {};

  constructor(
    private databaseName: string,
    private streamProvider: StreamProvider,
    private config: DocumentBundleConfig,
  ) {}


  public async create(collection: string, options: Document): Promise<void> {
    this.configs[collection] = options.storageEngine;
    //return this.rLock = new Promise<void>(async resolve => {
      //const path = this.config.documentBundle(collection);
      //const stream = this.streamProvider.source(path)
        //.pipe(loadFiles(file => nodePath.basename(file.path).split('.')[0]));

      //await super.create(collection, options || {});
      //this.configs[collection] = options.storageEngine;

      //await this.populate(collection, stream);
      //resolve();
    //});
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

  public async *stream(collection: string, documentIds: string[] | undefined): AsyncIterable<Document> {
    if (documentIds) {
      for (const id of documentIds) {
        let s = this.streamProvider.source(this.config.documentBundle(collection, id))
          .pipe(loadFiles(file => nodePath.basename(file.path).split('.')[0]));
        for await (const doc of s) {
          yield doc;
        }
      }
    }
    const stream = this.streamProvider.source(this.config.documentBundle(collection))
      .pipe(loadFiles(file => nodePath.basename(file.path).split('.')[0]));
    for await (const doc of stream) {
      yield doc;
    }
  }
}

//export class DocumentBundleStorage extends BufferStorage {
  //constructor(
    //databaseName: string,
    //streamProvider: StreamProvider,
    //private config: DocumentBundleConfig,
  //) { super(databaseName, streamProvider); }


  //public async create(collection: string, options: Document): Promise<void> {
    //return this.rLock = new Promise<void>(async resolve => {
      //const path = this.config.documentBundle(collection);
      //const stream = this.streamProvider.source(path)
        //.pipe(loadFiles(file => nodePath.basename(file.path).split('.')[0]));

      //await super.create(collection, options || {});
      //this.configs[collection] = options.storageEngine;

      //await this.populate(collection, stream);
      //resolve();
    //});
  //}

  //public async write(changes: ChangeStreamDocument<Document>[], options: WriteOptions) {
    //const writeErrors = await super.write(changes, options);
    //await this.streamProvider.source(changes)
      //.pipe(clone())
      //.pipe(createFiles(
        //c => this.config.documentBundle(c.ns.coll, c.documentKey._id),
        //c => c.operationType === 'delete' ? undefined : c.fullDocument,
      //))
      //.write();

    //return writeErrors;
  //}
//}
