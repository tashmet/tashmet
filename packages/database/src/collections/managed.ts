import {
  Cursor, Middleware, ReplaceOneOptions, QueryOptions, AggregationPipeline,
  DatabaseChange, Collection
} from '../interfaces';


export class ManagedCollection<T = any> extends Collection<T> {
  public constructor(
    private source: Collection<T>,
    middleware: Middleware[]
  ) {
    super();

    const emitters = {
      'change': 'processChange',
      'error': 'processError',
    };

    source.on('change', change => {
      this.processChange(change)
        .then(change => this.emit('change', change))
        .catch(err => this.emit('error', err));
    });
    source.on('error', err => {
      this.emit('error', err);
    });

    for (const mw of middleware.slice(0).reverse()) {
      this.use(mw.methods || {});
    }
    for (const mw of middleware) {
      if (mw.events) {
        for (const event of Object.keys(emitters)) {
          if ((mw.events as any)[event]) {
            this.proxy((mw.events as any)[event], (emitters as any)[event]);
          }
        }
      }
    }
  }

  public get name() {
    return this.source.name;
  }

  public toString(): string {
    return this.source.toString();
  }

  public aggregate<U>(pipeline: AggregationPipeline): Cursor<U> {
    return this.source.aggregate(pipeline);
  }

  public find(selector: object = {}, options: QueryOptions = {}): Cursor<T> {
    return this.source.find(selector, options);
  }

  public async findOne(selector: object): Promise<T | null> {
    return this.source.findOne(selector);
  }

  public async insertOne(doc: T): Promise<T> {
    return this.source.insertOne(doc);
  }

  public async insertMany(docs: T[]): Promise<T[]> {
    return this.source.insertMany(docs);
  }

  public async replaceOne(selector: object, doc: T, options?: ReplaceOneOptions): Promise<T | null> {
    return this.source.replaceOne(selector, doc, options);
  }

  public async deleteOne(selector: object): Promise<T | null> {
    return this.source.deleteOne(selector);
  }

  public async deleteMany(selector: object): Promise<T[]> {
    return this.source.deleteMany(selector);
  }

  private async processChange(change: DatabaseChange): Promise<DatabaseChange> {
    return change;
  }

  private proxy(fn: Function, methodName: string) {
    const f = (this as any)[methodName];
    (this as any)[methodName] = (...args: any[]) => fn(f.bind(this), ...args);
  }

  private use(mw: any) {
    for (const method of Object.keys(mw)) {
      if (typeof mw[method] === 'function' && (this as any)[method]) {
        this.proxy(mw[method], method);
      }
    }
  }
}
