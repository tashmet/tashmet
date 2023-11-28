export { ChangeStream, ChangeStreamDocument } from './changeStream.js';
export { Collection } from './collection.js';
export { Database } from './database.js';
export { TashmetError, TashmetServerError } from './error.js';
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

  constructor(private proxy: TashmetProxy) {
    this.connectionPromise = new Promise((resolve, reject) => {
      this.proxy.on('connected', resolve);
    });
  }

  static connect(proxy: TashmetProxy): Promise<Tashmet> {
    return new Tashmet(proxy).connect();
  }

  async connect(): Promise<this> {
    this.proxy.connect();
    await this.connectionPromise;
    return this;
  }

  close() {
    this.proxy.destroy();
  }

  db(name: string, options: DatabaseOptions = {}): Database {
    return new Database(name, this.proxy, options);
  }
}
