import {
  Cursor, Filter, Middleware, ReplaceOneOptions, QueryOptions, AggregationPipeline,
  DatabaseChange, Collection
} from '../interfaces';


export function withMiddleware<T = any>(
  collection: Collection<T>,
  middleware: (Middleware | ((collection: Collection<T>) => Middleware))[],
) {
  return new ManagedCollection(collection, middleware.map(m =>
    typeof m === 'function' ? m(collection) : m
  ));
}

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

  public aggregate<U>(pipeline: AggregationPipeline): Promise<U[]> {
    return this.source.aggregate(pipeline);
  }

  public find(filter: Filter<T> = {}, options: QueryOptions = {}): Cursor<T> {
    return this.source.find(filter, options);
  }

  public async findOne(filter: Filter<T>): Promise<T | null> {
    return this.source.findOne(filter);
  }

  public async insertOne(doc: T): Promise<T> {
    return this.source.insertOne(doc);
  }

  public async insertMany(docs: T[]): Promise<T[]> {
    return this.source.insertMany(docs);
  }

  public async replaceOne(filter: Filter<T>, doc: T, options?: ReplaceOneOptions): Promise<T | null> {
    return this.source.replaceOne(filter, doc, options);
  }

  public async deleteOne(filter: Filter<T>): Promise<T | null> {
    return this.source.deleteOne(filter);
  }

  public async deleteMany(filter: Filter<T>): Promise<T[]> {
    return this.source.deleteMany(filter);
  }

  private async processChange(change: DatabaseChange): Promise<DatabaseChange> {
    return change;
  }

  private proxy(fn: Function, methodName: string) {
    const f = (this as any)[methodName];
    (this as any)[methodName] = (...args: any[]) => fn(f.bind(this))(...args);
  }

  private use(mw: any) {
    for (const method of Object.keys(mw)) {
      if (typeof mw[method] === 'function' && (this as any)[method]) {
        this.proxy(mw[method], method);
      }
    }
  }
}
