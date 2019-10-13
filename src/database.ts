import {provider, Container} from '@ziggurat/tiamat';
import {EventEmitter} from 'eventemitter3';
import {ManagedCollection} from './collections/managed';
import {
  Collection,
  CollectionConfig,
  CollectionProducer,
  Database,
  DatabaseConfig,
  Middleware
} from './interfaces';

@provider({
  key: 'ziggurat.Database',
  inject: [
    'tiamat.Container',
    'ziggurat.DatabaseConfig',
  ]
})
export class DatabaseService extends EventEmitter implements Database {
  private collections: {[name: string]: Collection} = {};
  private syncedCount = 0;

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

    let collection: Collection;
    let middleware = this.config.use || [];

    if (typeof producer === 'function') {
      collection = producer(this.container, name);
    } else {
      collection = producer.source(this.container, name);
      middleware = (producer.useBefore || []).concat(middleware, producer.use || []);
    }

    this.collections[name] = new ManagedCollection(name, collection, middleware
      .reduce((acc, produce) => {
        const res = produce(this.container, collection);
        return acc.concat(Array.isArray(res) ? res : [res]);
      }, [] as Middleware[]));

    collection.on('ready', () => {
      this.syncedCount += 1;
      if (this.syncedCount === Object.keys(this.collections).length) {
        this.emit('database-synced');
      }
    });

    collection.on('document-upserted', (doc: any) => {
      this.emit('document-upserted', doc, collection);
    });
    collection.on('document-removed', (doc: any) => {
      this.emit('document-removed', doc, collection);
    });
    collection.on('document-error', (err: any) => {
      this.emit('document-error', err, collection);
    });

    return this.collections[name];
  }
}
