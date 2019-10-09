import {EventEmitter} from 'eventemitter3';
import {Container} from '@ziggurat/tiamat';
import {Collection, CollectionProducer, QueryOptions} from '../interfaces';

export class Middleware<T = any> {
  public constructor(protected source: Collection<T>) {}
}

export type MiddlewareProducer<T = any> =
  (container: Container, source: Collection) => Middleware<T> | Middleware<T>[];

export interface ManagedCollectionConfig {
  source: CollectionProducer;

  middleware: MiddlewareProducer[];
}

export function managed(config: ManagedCollectionConfig): CollectionProducer {
  return (container: Container, name: string): Collection => {
    const source = config.source(container, name);

    return new ManagedCollection(name, source, config.middleware
      .reduce((acc, produce) => {
        const res = produce(container, source);
        return acc.concat(Array.isArray(res) ? res : [res]);
      }, [] as Middleware[]));
  };
}

export class ManagedCollection<T = any> extends EventEmitter implements Collection<T> {
  public constructor(
    public readonly name: string,
    private source: Collection<T>,
    middleware: Middleware[]
  ) {
    super();
    for (let mw of middleware.reverse()) {
      this.use(mw);
    }
  }

  public async find(selector: object = {}, options: QueryOptions = {}): Promise<any[]> {
    return this.source.find(selector, options);
  }

  public async findOne(selector: object): Promise<any> {
    return this.source.findOne(selector);
  }

  public upsert(obj: any): Promise<any> {
    return this.source.upsert(obj);
  }

  public async remove(selector: object): Promise<any[]> {
    return this.source.remove(selector);
  }

  public async count(selector?: object): Promise<number> {
    return this.source.count(selector);
  }

  private use(mw: any) {
    for (let prop of Object.getOwnPropertyNames(mw).concat(Object.getOwnPropertyNames(mw.__proto__))) {
      if (typeof mw[prop] === 'function' && prop !== 'constructor' && (this as any)[prop]) {
        const f = (this as any)[prop];
        (this as any)[prop] = mw[prop](f.bind(this));
      }
    }
  }
}
