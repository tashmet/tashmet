import {provider, Container} from '@ziggurat/tiamat';
import {Collection, CollectionProducer} from './interfaces';
import {Database, DatabaseConfig} from './interfaces';
import {EventEmitter} from 'eventemitter3';

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
    config: DatabaseConfig,
  ) {
    super();
    for (let name of Object.keys(config.collections)) {
      this.createCollection(name, config.collections[name]);
    }
  }

  public collection(name: string): Collection {
    return this.collections[name];
  }

  public createCollection<T = any>(name: string, producer: CollectionProducer<T>): Collection<T>
  {
    if (name in this.collections) {
      throw new Error(`A collection named '${name}' already exists`);
    }

    let collection = producer(this.container, name);

    this.collections[name] = collection;

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

    return collection;
  }
}
