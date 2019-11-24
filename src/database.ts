import {provider} from '@ziggurat/tiamat';
import {EventEmitter} from 'eventemitter3';
import {ManagedCollection} from './collections/managed';
import {
  Collection,
  CollectionConfig,
  CollectionProducer,
  Database,
  DatabaseConfig,
  Middleware,
} from './interfaces';

@provider({
  key: 'ziggurat.Database',
  inject: [
    'ziggurat.DatabaseConfig',
  ]
})
export class DatabaseService extends EventEmitter implements Database {
  private collections: {[name: string]: Collection} = {};

  public constructor(
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
      source = producer(name);
    } else {
      source = producer.source(name);
      middleware = (producer.useBefore || []).concat(middleware, producer.use || []);
    }

    let collection = new ManagedCollection(
      source, middleware.reduce((acc, produce) => acc.concat(produce(source)), [] as Middleware[]));

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
