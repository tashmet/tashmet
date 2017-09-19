import {inject, provider, activate} from '@ziggurat/tiamat';
import {Injector} from '@ziggurat/tiamat';
import {LocalDatabase, RemoteDatabase, Collection, Database, DatabaseConfig,
  CollectionMapping, CacheEvaluator, QueryOptions} from '../interfaces';
import {CollectionController} from '../controllers/collection';
import {Processor} from '../controllers/processor';
import {RoutineAggregator} from '../controllers/routine';
import {Transformer, Validator} from '../schema/interfaces';
import {UpsertPipe, RevisionUpsertPipe, ValidationPipe, InstancePipe} from '../pipes';
import {EventEmitter} from 'eventemitter3';
import {DocumentIdEvaluator} from './cache/documentId';
import {QueryHashEvaluator} from './cache/queryHash';
import {RangeEvaluator} from './cache/range';
import {each, transform} from 'lodash';
import * as Promise from 'bluebird';

@provider({
  for: 'isimud.Database',
  singleton: true
})
export class DatabaseService extends EventEmitter implements Database
{
  private collections: {[name: string]: CollectionController} = {};
  private syncedCount = 0;

  @inject('isimud.DatabaseConfig') private dbConfig: DatabaseConfig;
  @inject('isimud.LocalDatabase') private localDB: LocalDatabase;
  @inject('isimud.RemoteDatabase') private remoteDB: RemoteDatabase;
  @inject('isimud.RoutineAggregator') private routineAggregator: RoutineAggregator;
  @inject('isimud.Transformer') private transformer: Transformer;
  @inject('isimud.Validator') private validator: Validator;
  @inject('tiamat.Injector') private injector: Injector;

  public collection(name: string): Collection {
    return this.collections[name];
  }

  @activate('isimud.Collection')
  private activateCollectionController(collection: CollectionController): CollectionController {
    let providerMeta = Reflect.getOwnMetadata('tiamat:provider', collection.constructor);
    let meta = Reflect.getOwnMetadata('isimud:collection', collection.constructor);

    this.collections[meta.name] = collection;

    // TODO: Support collections without source.
    let source = this.dbConfig.sources[providerMeta.for](this.injector);
    let cache = this.localDB.createCollection(meta.name);
    let buffer = this.localDB.createCollection(meta.name + ':buffer');
    let routines = this.routineAggregator.getRoutines(collection);

    let cachePipe = new RevisionUpsertPipe(cache);
    let persistPipe = new UpsertPipe(source);
    let validationPipe = new ValidationPipe(this.validator);
    let instancePipe = new InstancePipe(this.transformer, 'persist', meta.model);
    let processor = new Processor()
      .pipe('populate-pre-buffer', 'populate', {
        'transform': instancePipe,
        'validate': validationPipe
      })
      .pipe('populate-post-buffer', 'populate', {
        'cache': cachePipe
      })
      .pipe('source-upsert', true, {
        'transform': instancePipe,
        'validate': validationPipe,
        'cache': cachePipe
      })
      .pipe('upsert', true, {
        'validate': validationPipe,
        'cache': cachePipe,
        'persist': persistPipe
      })
      .pipe('cache', false, {
        'cache': cachePipe
      });

    collection.setSource(source);
    collection.setCache(cache);
    collection.setBuffer(buffer);
    collection.setProcessor(processor);
    routines.forEach((routine: any) => {
      routine.setController(collection);
      processor.addHooks(routine);
    });
    collection.addCacheEvaluator(new QueryHashEvaluator());
    collection.addCacheEvaluator(new DocumentIdEvaluator());
    collection.addCacheEvaluator(new RangeEvaluator());

    if (this.isServer()) {
      if (meta.populateAfter.length > 0) {
        let promises = transform(meta.populateAfter, (result: any, depName: string) => {
          result.push(this.injector.get<CollectionController>(depName).populate());
        });
        Promise.all(promises).then(deps => {
          collection.populate();
        });
      } else {
        collection.populate();
      }
    }

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

  private isServer() {
     return ! (typeof window !== 'undefined' && window.document);
  }
}
