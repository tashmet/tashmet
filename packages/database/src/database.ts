import {provider, Logger} from '@ziqquratu/core';
import {EventEmitter} from 'eventemitter3';
import {ManagedCollection} from './collections/managed';
import {
  Collection,
  CollectionConfig,
  CollectionFactory,
  Database,
  DatabaseConfig,
  Middleware,
} from './interfaces';

@provider({
  key: 'ziqquratu.Database',
  inject: [
    'ziqquratu.DatabaseConfig',
    'ziqquratu.DatabaseLogger',
  ]
})
export class DatabaseService extends EventEmitter implements Database {
  private collections: {[name: string]: Collection} = {};
  private logger: Logger;

  public constructor(
    private config: DatabaseConfig,
    logger: Logger,
  ) {
    super();
    this.logger = logger.inScope('DatabaseService');
    for (const name of Object.keys(config.collections)) {
      this.createCollection(name, config.collections[name]);
    }
  }

  public collection(name: string): Collection {
    return this.collections[name];
  }

  public createCollection<T = any>(
    name: string, factory: CollectionFactory<T> | CollectionConfig): Collection<T>
  {
    try {
      if (name in this.collections) {
        throw new Error(`A collection named '${name}' already exists`);
      }

      let source: Collection;
      let middlewareFactories = this.config.use || [];

      if (factory instanceof CollectionFactory) {
        source = factory.create(name);
      } else {
        source = factory.source.create(name);
        middlewareFactories = (factory.useBefore || []).concat(
          middlewareFactories, factory.use || []);
      }

      const collection = new ManagedCollection(
        source, middlewareFactories.reduce((middleware, middlewareFactory) => {
          return middleware.concat(middlewareFactory.create(source, this));
        }, [] as Middleware[]));

      collection.on('document-upserted', (doc: any) => {
        this.emit('document-upserted', doc, collection);
      });
      collection.on('document-removed', (doc: any) => {
        this.emit('document-removed', doc, collection);
      });
      collection.on('document-error', (err: any) => {
        this.emit('document-error', err, collection);
      });

      this.logger.inScope('createCollection').info(source.toString());

      return this.collections[name] = collection;
    } catch (err) {
      this.logger.error(err.message);
      throw err;
    }
  }
}
