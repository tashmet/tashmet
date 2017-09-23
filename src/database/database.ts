import {inject, provider, activate} from '@ziggurat/tiamat';
import {Injector} from '@ziggurat/tiamat';
import {CollectionFactory, Collection, MemoryCollectionConfig, Database, DatabaseConfig,
  CacheEvaluator, QueryOptions} from '../interfaces';
import {RoutineProvider} from './interfaces';
import {Controller} from './controller';
import {createRoutines} from './routine';
import {Routine} from '../processing/interfaces';
import {Processor} from '../processing/processor';
import {UpsertPipe, RevisionUpsertPipe, ValidationPipe, InstancePipe} from '../processing/pipes';
import {Transformer, Validator} from '../schema/interfaces';
import {EventEmitter} from 'eventemitter3';
import {DocumentIdEvaluator} from '../caching/documentId';
import {QueryHashEvaluator} from '../caching/queryHash';
import {RangeEvaluator} from '../caching/range';
import {each, includes, isArray, map, transform} from 'lodash';
import * as Promise from 'bluebird';

@provider({
  for: 'isimud.Database',
  singleton: true
})
export class DatabaseService extends EventEmitter implements Database
{
  private collections: {[name: string]: Controller} = {};
  private syncedCount = 0;

  @inject('isimud.DatabaseConfig') private dbConfig: DatabaseConfig;
  @inject('isimud.MemoryCollectionFactory') private memory: CollectionFactory<MemoryCollectionConfig>;
  @inject('isimud.Transformer') private transformer: Transformer;
  @inject('isimud.Validator') private validator: Validator;
  @inject('tiamat.Injector') private injector: Injector;

  public collection(name: string): Collection {
    return this.collections[name];
  }

  @activate('isimud.Collection')
  private activateController(collection: Controller): Controller {
    let providerMeta = Reflect.getOwnMetadata('tiamat:provider', collection.constructor);
    let meta = Reflect.getOwnMetadata('isimud:collection', collection.constructor);

    this.collections[meta.name] = collection;

    collection.locked = true;

    // TODO: Support collections without source.
    let source = this.dbConfig.sources[providerMeta.for](this.injector);
    let cache = this.memory.createCollection(meta.name, {indices: ['_id']});
    let buffer = this.memory.createCollection(meta.name + ':buffer', {indices: ['_id']});
    let routines = createRoutines(this.dbConfig.routines || [], collection, this.injector);

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

    each(routines, routine => {
      processor.routine(routine);
    });

    collection.setSource(source);
    collection.setCache(cache);
    collection.setBuffer(buffer);
    collection.setProcessor(processor);
    collection.addCacheEvaluator(new QueryHashEvaluator());
    collection.addCacheEvaluator(new DocumentIdEvaluator());
    collection.addCacheEvaluator(new RangeEvaluator());

    const populate = this.dbConfig.populate;
    if (populate === true || (isArray(populate) && includes(populate, providerMeta.for))) {
      Promise.all(transform(meta.populateAfter, (result: any, depName: string) => {
        result.push(this.injector.get<Controller>(depName).populate());
      }))
        .then(() => {
          return collection.populate();
        })
        .then(() => {
          collection.locked = false;
        });
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
}
