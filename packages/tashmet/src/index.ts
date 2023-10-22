export { ChangeStream, ChangeStreamDocument } from './changeStream.js';
export { Collection } from './collection.js';
export { Database } from './database.js';
export { AbstractCursor } from './cursor/abstractCursor.js';
export { AggregationCursor } from './cursor/aggregationCursor.js';
export { GlobalAggregationCursor } from './cursor/globalAggregationCursor.js';
export { FindCursor } from './cursor/findCursor.js';
export * from './interfaces.js';
export { AggregateOptions } from './operations/aggregate.js';

import { TashmetProxy, Document } from './interfaces.js';
import { Database } from './database.js';
import { GlobalAggregationCursor } from './cursor/globalAggregationCursor.js';
import { AggregateOptions } from './operations/aggregate.js';


export default class Tashmet {
  private connectionPromise: Promise<void>;

  public constructor(
    private proxy: TashmetProxy,
  ) {
    this.connectionPromise = new Promise((resolve, reject) => {
      this.proxy.on('connected', resolve);
    });
  }

  public static connect(proxy: TashmetProxy): Promise<Tashmet> {
    return new Tashmet(proxy).connect();
  }

  public async connect(): Promise<this> {
    this.proxy.connect();
    await this.connectionPromise;
    return this;
  }

  public db(name: string): Database {
    return new Database(name, this.proxy);
  }

  public aggregate<TSchema extends Document = Document>(
    collection: Document[],
    pipeline: Document[],
    options?: AggregateOptions
  ): GlobalAggregationCursor<TSchema> {
    return new GlobalAggregationCursor(collection, this.proxy, pipeline, options);
  }
}
