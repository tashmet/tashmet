export { ChangeStream, ChangeStreamDocument } from './changeStream.js';
export { Collection } from './collection.js';
export { Database } from './database.js';
export { AbstractCursor } from './cursor/abstractCursor.js';
export { AggregationCursor } from './cursor/aggregationCursor.js';
export { FindCursor } from './cursor/findCursor.js';
export * from './interfaces.js';
export { AggregateOptions } from './operations/aggregate.js';

import { Store, Document } from './interfaces.js';
import { Database } from './database.js';
import { GlobalAggregationCursor } from './cursor/globalAggregationCursor.js';
import { AggregateOptions } from './operations/aggregate.js';


export default class Tashmet {
  public constructor(
    private store: Store,
  ) {}

  public db(name: string): Database {
    return new Database(name, this.store);
  }

  public aggregate<TSchema extends Document = Document>(
    collection: Document[],
    pipeline: Document[],
    options?: AggregateOptions
  ): GlobalAggregationCursor<TSchema> {
    return new GlobalAggregationCursor(collection, this.store, pipeline, options);
  }
}
