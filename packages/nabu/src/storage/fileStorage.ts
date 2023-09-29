import { CollectionRegistry, Document, Streamable, StreamOptions, Writable, WriteOptions } from '@tashmet/engine';
import { ChangeStreamDocument } from '@tashmet/bridge';

import {
  NabuDatabaseConfig,
  StreamProvider,
} from '../interfaces.js';
import { clone } from '../operators/common.js';
import { NabuContentRules } from '../index.js';


export class FileStorage implements CollectionRegistry, Streamable, Writable {
  protected configs: Record<string, Document> = {};

  constructor(
    public readonly databaseName: string,
    private streamProvider: StreamProvider,
    private config: NabuDatabaseConfig,
    private contentRules: NabuContentRules
  ) {}


  public async create(collection: string, options: Document): Promise<void> {
    this.configs[collection] = options.storageEngine;
  }

  public async drop(collection: string): Promise<void> {
    delete this.configs[collection];
  }

  public async write(changes: ChangeStreamDocument<Document>[], options: WriteOptions) {
    if (changes.length === 0) {
      return [];
    }

    const dbChanges = changes.filter(c => c.ns.db === this.databaseName);

    const collections = await this.streamProvider.source(dbChanges)
      .pipe([
        {$unwind: '$ns.coll'},
        {$group: {_id: '$ns.coll'}},
      ])
      .toArray()

    const writeErrors: any[] = [];

    for (const coll of collections.map(c => c._id)) {
      const config = this.config(coll);
      const path = (c: ChangeStreamDocument) => config.lookup(c.documentKey?._id as any);

      const errors = await this.streamProvider.source(dbChanges)
        .pipe([
          { $match: { 'ns.coll': coll } }
        ])
        .pipe(clone())
        .pipe([
          {
            $project: {
              _id: 0,
              overwrite: { $ne: [ "$operationType", "insert" ] },
              path: { $function: { body: path, args: [ "$$ROOT" ], lang: "js" }},
              isDir: { $literal: false },
              content: {
                $cond: {
                  if: { $ne: ["$operationType", "delete"] },
                  then: '$fullDocument',
                  else: { $literal: undefined }
                }
              },
            },
          },
        ])
        .pipe(config.write || this.contentRules.writePipeline)
        .write();

      writeErrors.push(...errors);
    }

    return writeErrors;
  }

  public async *stream(collection: string, options?: StreamOptions): AsyncIterable<Document> {
    const { documentIds, projection } = options || {};
    const config = this.config(collection);

    const paths = documentIds
      ? documentIds.map(id => config.lookup(id))
      : [config.scan];

    for (const path of paths) {
      const stream = this.streamProvider.source(path, { content: projection?._id !== 1})
        .pipe(config.read || this.contentRules.readPipeline)
        .pipe(
          { $replaceRoot: { newRoot: '$content' } }
        )

      for await (const doc of stream) {
        yield doc;
      }
    }
  }
}
