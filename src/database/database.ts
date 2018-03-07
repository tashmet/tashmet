import {inject, provider, activate, Injector} from '@ziggurat/tiamat';
import {ModelRegistry, Transformer, Validator} from '@ziggurat/mushdamma';
import {Processor, ProcessorFactory, Middleware} from '@ziggurat/ningal';
import {CollectionFactory, Collection, MemoryCollectionConfig,
  CacheEvaluator, QueryOptions} from '../interfaces';
import {Database, MiddlewareProvider} from './interfaces';
import {Controller} from './controller';
import {CacheCollection} from '../collections/cache';
import {NullCollection} from '../collections/null';
import {ReferenceValidationPipe} from '../pipes/reference';
import {RevisionUpsertPipe} from '../pipes/upsert';
import {ValidationPipe} from '../pipes/validation';
import {EventEmitter} from 'eventemitter3';
import {DocumentIdEvaluator} from '../caching/documentId';
import {QueryHashEvaluator} from '../caching/queryHash';
import {RangeEvaluator} from '../caching/range';
import {Document} from '../models/document';
import {each, includes, isArray, map, transform} from 'lodash';

@provider({
  key: 'isimud.Database'
})
export class DatabaseService extends EventEmitter implements Database {
  private collections: {[name: string]: Controller} = {};
  private syncedCount = 0;

  @inject('isimud.MemoryCollectionFactory') private memory: CollectionFactory<MemoryCollectionConfig>;
  @inject('mushdamma.ModelRegistry') private models: ModelRegistry;
  @inject('mushdamma.Transformer') private transformer: Transformer;
  @inject('mushdamma.Validator') private validator: Validator;
  @inject('ningal.ProcessorFactory') private processorFactory: ProcessorFactory;
  @inject('tiamat.Injector') private injector: Injector;

  public collection(name: string): Collection {
    return this.collections[name];
  }

  @activate({
    instanceOf: Controller
  })
  private activateController(collection: Controller): Controller {
    const key = Reflect.getOwnMetadata('tiamat:key', collection.constructor);
    const config = Reflect.getOwnMetadata('isimud:collection', collection.constructor);
    const modelName = Reflect.getOwnMetadata('mushdamma:model', config.model).name;

    this.collections[config.name] = collection;

    let source = config.source
      ? config.source(this.injector, modelName)
      : new NullCollection(key + ':source');

    let cache = this.memory.createCollection(config.name, {indices: ['_id']});
    let buffer = this.memory.createCollection(config.name + ':buffer', {indices: ['_id']});

    let cachePipe = new RevisionUpsertPipe(cache);
    let validationPipe = new ValidationPipe(this.validator);
    let referencePipe = new ReferenceValidationPipe(this.injector, this.models);
    let processor = this.processorFactory.createProcessor<Document>()
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
        'persist': doc => source.upsert(doc)
      })
      .pipe('unpersist', 'remove', {
        'unpersist': async doc => {
          await source.remove({_id: doc._id});
          return doc;
        }
      })
      .pipe('uncache', 'remove', {
        'uncache': async doc => {
          await cache.remove({_id: doc._id});
          return doc;
        },
      })
      .pipe('cache', false, {
        'cache': cachePipe
      });

    for (let middlewareProvider of config.middleware || []) {
      processor.middleware(middlewareProvider(this.injector, collection));
    }

    collection.setSource(source);
    collection.setCache(new CacheCollection(cache, [
      new QueryHashEvaluator(),
      new DocumentIdEvaluator(),
      new RangeEvaluator()
    ]));
    collection.setBuffer(buffer);
    collection.setProcessor(processor);

    if (config.populate) {
      Promise.all(transform(config.populateAfter, (result: any, depName: string) => {
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
