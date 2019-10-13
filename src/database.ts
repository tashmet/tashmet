import {provider, Container} from '@ziggurat/tiamat';
import {EventEmitter} from 'eventemitter3';
import {ManagedCollection} from './collections/managed';
import {
  Collection,
  CollectionConfig,
  CollectionProducer,
  Database,
  DatabaseConfig,
  Middleware,
  MiddlewareProducer
} from './interfaces';

export function produceMiddleware(
  producers: MiddlewareProducer[], source: Collection, container: Container
) {
  return producers
    .reduce((acc, produce) => {
      const res = produce(container, source);
      return acc.concat(Array.isArray(res) ? res : [res]);
    }, [] as Middleware[]);
}

@provider({
  key: 'ziggurat.Database',
  inject: [
    'tiamat.Container',
    'ziggurat.DatabaseConfig',
  ]
})
export class DatabaseService extends EventEmitter implements Database {
  private collections: {[name: string]: Collection} = {};

  public constructor(
    private container: Container,
    private config: DatabaseConfig,
  ) {
    super();
    for (let name of Object.keys(config.collections)) {
      this.createCollection(name, config.collections[name]);
    }
  }

  public collection(name: string): Collection {
    return this.collections[name];
  }

  public createCollection<T = any>(
    name: string, producer: CollectionProducer<T> | CollectionConfig): Collection<T>
  {
    if (name in this.collections) {
      throw new Error(`A collection named '${name}' already exists`);
    }

    let source: Collection;
    let middleware = this.config.use || [];

    if (typeof producer === 'function') {
      source = producer(this.container, name);
    } else {
      source = producer.source(this.container, name);
      middleware = (producer.useBefore || []).concat(middleware, producer.use || []);
    }

    let collection = new ManagedCollection(
      source, produceMiddleware(middleware, source, this.container));

    collection.on('document-upserted', (doc: any) => {
      this.emit('document-upserted', doc, collection);
    });
    collection.on('document-removed', (doc: any) => {
      this.emit('document-removed', doc, collection);
    });
    collection.on('document-error', (err: any) => {
      this.emit('document-error', err, collection);
    });

    return this.collections[name] = collection;
  }
}
