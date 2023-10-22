import { CollectionRegistry, Streamable, StreamOptions, Writable, WriteOptions } from '@tashmet/engine';
import { AggregationCursor, ChangeStreamDocument, Document } from '@tashmet/tashmet';
import { NabuDatabaseConfig } from '../interfaces.js';
import { IO } from '../io.js';
import Nabu from '../index.js';

export class FileStorage implements CollectionRegistry, Streamable, Writable {
  protected configs: Record<string, Document> = {};
  protected io: Record<string, IO> = {};

  constructor(
    public readonly databaseName: string,
    private nabu: Nabu,
    private config: NabuDatabaseConfig,
  ) {}

  public async create(collection: string, options: Document): Promise<void> {
    this.io[collection] = this.config(collection)(this.nabu);
  }

  public async drop(collection: string): Promise<void> {
    delete this.io[collection];
  }

  public async *stream(collection: string, options?: StreamOptions): AsyncIterable<Document> {
    const { documentIds, projection } = options || {};
    const io = this.io[collection];
    let cursor: AggregationCursor<Document>;

    if (documentIds) {
      cursor = io.lookup(documentIds);
    } else {
      cursor = io.scan();
    }

    for await (const doc of cursor) {
      yield doc;
    }
  }

  public async write(changes: ChangeStreamDocument<Document>[], options: WriteOptions) {
    if (changes.length === 0) {
      return [];
    }

    const dbChanges = changes.filter(c => c.ns.db === this.databaseName);

    const collections = await this.nabu.aggregate(dbChanges, [
      {$unwind: '$ns.coll'},
      {$group: {_id: '$ns.coll'}},
    ]).toArray();

    const writeErrors: any[] = [];

    for (const coll of collections.map(c => c._id)) {
      const io = this.io[coll];

      writeErrors.push(...await this.nabu
        .aggregate(dbChanges, [{ $match: { 'ns.coll': coll } }, ...io.outputPipeline])
        .toArray()
      );
    }

    return writeErrors;
  }
}
