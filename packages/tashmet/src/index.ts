export { ChangeStream, ChangeStreamDocument } from './changeStream.js';
export { Collection } from './collection.js';
export { Database } from './database.js';
export { TashmetNamespace, TashmetCollectionNamespace } from './utils.js';
export { AbstractCursor } from './cursor/abstractCursor.js';
export { AggregationCursor } from './cursor/aggregationCursor.js';
export { FindCursor } from './cursor/findCursor.js';
export * from './interfaces.js';
export { AggregateOptions } from './operations/aggregate.js';

import { TashmetProxy } from './interfaces.js';
import { Database, DatabaseOptions } from './database.js';


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

  public close() {
    this.proxy.destroy();
  }

  public db(name: string, options: DatabaseOptions = {}): Database {
    return new Database(name, this.proxy, options);
  }
}
