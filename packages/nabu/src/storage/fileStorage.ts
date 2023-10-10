import { CollectionRegistry, Document, Streamable, StreamOptions, Writable, WriteOptions } from '@tashmet/engine';
import { ChangeStreamDocument } from '@tashmet/bridge';

import {
  NabuDatabaseConfig,
  StreamProvider,
} from '../interfaces.js';


export class FileStorage implements CollectionRegistry, Streamable, Writable {
  protected configs: Record<string, Document> = {};

  constructor(
    public readonly databaseName: string,
    private streamProvider: StreamProvider,
    private config: NabuDatabaseConfig,
  ) {}

  public async create(collection: string, options: Document): Promise<void> {
    this.configs[collection] = options.storageEngine;
  }

  public async drop(collection: string): Promise<void> {
    delete this.configs[collection];
  }

  public async *stream(collection: string, options?: StreamOptions): AsyncIterable<Document> {
    const { documentIds, projection } = options || {};
    const config = this.config(collection);

    const paths = documentIds
      ? documentIds.map(id => config.lookup(id))
      : [config.scan];

    for (const path of paths) {
      const stream = this.streamProvider
        .source(path, { content: projection?._id !== 1})
        .pipe(this.readPipeline(collection))

      for await (const doc of stream) {
        yield doc;
      }
    }
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
      writeErrors.push(...await this.streamProvider
        .source(dbChanges)
        .pipe(this.writePipeline(coll))
        .toArray()
      );
    }

    return writeErrors;
  }

  public readPipeline(collection: string) {
    return this.config(collection).content.read;
  }

  public writePipeline(collection: string) {
    const config = this.config(collection);
    const path = (c: ChangeStreamDocument) => config.lookup(c.documentKey?._id as any);

    return [
      { $match: { 'ns.coll': collection } },
      {
        $project: {
          _id: 0,
          content: {
            $cond: {
              if: { $ne: ["$operationType", "delete"] },
              then: "$fullDocument",
              else: { $literal: undefined }
            }
          },
          path: { $function: { body: path, args: [ "$$ROOT" ], lang: "js" }},
          mode: {
            $switch: {
              branches: [
                { case: { $eq: ['$operationType', 'insert'] }, then: 'create' },
                { case: { $eq: ['$operationType', 'replace'] }, then: 'update' },
                { case: { $eq: ['$operationType', 'delete'] }, then: 'delete' },
              ]
            }
          },
        },
      },
      ...config.content.write,
      {
        $write: {
          content: {
            $cond: {
              if: { $ne: ['$mode', 'delete'] },
              then: '$content',
              else: null
            }
          },
          to: '$path',
          overwrite: { $ne: ['$mode', 'create'] },
        }
      }
    ]
  }
}
