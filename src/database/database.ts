import {inject, provider, activate, Injector} from '@ziggurat/tiamat';
import {ModelRegistry, Transformer, Validator} from '@ziggurat/mushdamma';
import {Processor, ProcessorFactory, Routine} from '@ziggurat/ningal';
import {CollectionFactory, Collection, MemoryCollectionConfig,
  CacheEvaluator, QueryOptions} from '../interfaces';
import {Database, DatabaseConfig, RoutineProvider} from './interfaces';
import {Controller} from './controller';
import {createRoutines} from './routine';
import {CacheCollection} from '../collections/cache';
import {NullCollection} from '../collections/null';
import {ReferenceValidationPipe} from '../pipes/reference';
import {UpsertPipe, RevisionUpsertPipe} from '../pipes/upsert';
import {ValidationPipe} from '../pipes/validation';
import {EventEmitter} from 'eventemitter3';
import {DocumentIdEvaluator} from '../caching/documentId';
import {QueryHashEvaluator} from '../caching/queryHash';
import {RangeEvaluator} from '../caching/range';
import {each, includes, isArray, map, transform} from 'lodash';

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
  @inject('mushdamma.ModelRegistry') private models: ModelRegistry;
  @inject('mushdamma.Transformer') private transformer: Transformer;
  @inject('mushdamma.Validator') private validator: Validator;
  @inject('ningal.ProcessorFactory') private processorFactory: ProcessorFactory;
  @inject('tiamat.Injector') private injector: Injector;

  public collection(name: string): Collection {
    return this.collections[name];
  }

  @activate('isimud.Collection')
  private activateController(collection: Controller): Controller {
    let providerMeta = Reflect.getOwnMetadata('tiamat:provider', collection.constructor);
    let meta = Reflect.getOwnMetadata('isimud:collection', collection.constructor);

    this.collections[meta.name] = collection;

    let source: Collection;
    if (this.dbConfig.sources[providerMeta.for]) {
      source = this.dbConfig.sources[providerMeta.for](this.injector, meta.model);
    } else {
      source = new NullCollection(providerMeta.for + ':source');
    }

    let cache = this.memory.createCollection(meta.name, {indices: ['_id']});
    let buffer = this.memory.createCollection(meta.name + ':buffer', {indices: ['_id']});
    let routines = createRoutines(this.dbConfig.routines || [], collection, this.injector);

    let cachePipe = new RevisionUpsertPipe(cache);
    let persistPipe = new UpsertPipe(source);
    let validationPipe = new ValidationPipe(this.validator);
    let referencePipe = new ReferenceValidationPipe(this.injector, this.models);
    let processor = this.processorFactory.createProcessor()
      .pipe('populate-pre-buffer', 'populate', {
        'validate': validationPipe,
        'validate-references': referencePipe
      })
      .pipe('populate-post-buffer', 'populate', {
        'cache': cachePipe
      })
      .pipe('source-upsert', true, {
        'validate': validationPipe,
        'validate-references': referencePipe,
        'cache': cachePipe
      })
      .pipe('upsert', true, {
        'validate': validationPipe,
        'validate-references': referencePipe,
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
    collection.setCache(new CacheCollection(cache, [
      new QueryHashEvaluator(),
      new DocumentIdEvaluator(),
      new RangeEvaluator()
    ]));
    collection.setBuffer(buffer);
    collection.setProcessor(processor);

    const populate = this.dbConfig.populate;
    if (populate === true || (isArray(populate) && includes(populate, providerMeta.for))) {
      Promise.all(transform(meta.populateAfter, (result: any, depName: string) => {
        result.push(this.injector.get<Controller>(depName).populate());
      }))
        .then(() => {
          return collection.populate();
        });
    } else {
      collection.locked = false;
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
