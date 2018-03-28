import {getType} from 'reflect-helper';
import {inject, optional, provider, activate, Injector,
  ServiceIdentifier} from '@ziggurat/tiamat';
import {ModelRegistry, ModelAnnotation, Transformer, Validator} from '@ziggurat/mushdamma';
import {Processor, ProcessorFactory, Middleware} from '@ziggurat/ningal';
import {CollectionFactory, Collection, MemoryCollectionConfig,
  CacheEvaluator, QueryOptions, Query} from '../interfaces';
import {CollectionConfig, Database, MiddlewareProvider} from './interfaces';
import {Controller} from './controller';
import {CacheCollection} from '../collections/cache';
import {NullCollection} from '../collections/null';
import {RevisionUpsertPipe} from '../pipes/upsert';
import {ValidationPipe} from '../pipes/validation';
import {EventEmitter} from 'eventemitter3';
import {DocumentIdEvaluator} from '../caching/documentId';
import {QueryHashEvaluator} from '../caching/queryHash';
import {RangeEvaluator} from '../caching/range';
import {Document} from '../models/document';
import {each, includes, isArray, map, transform} from 'lodash';
import {CollectionAnnotation} from './decorators';

@provider({
  key: 'isimud.Database'
})
export class DatabaseService extends EventEmitter implements Database {
  private collections: {[name: string]: Controller} = {};
  private syncedCount = 0;

  public constructor(
    @inject('isimud.MemoryCollectionFactory')
    private memory: CollectionFactory<MemoryCollectionConfig>,
    @inject('isimud.Middleware') @optional()
    private middleware: MiddlewareProvider[] = [],
    @inject('mushdamma.ModelRegistry') private models: ModelRegistry,
    @inject('mushdamma.Transformer') private transformer: Transformer,
    @inject('mushdamma.Validator') private validator: Validator,
    @inject('ningal.ProcessorFactory') private processorFactory: ProcessorFactory,
    @inject('tiamat.Injector') private injector: Injector,
  ) {
    super();
  }

  public collection(name: string): Collection {
    return this.collections[name];
  }

  public createCollection<C extends Controller<any>>(
    key: ServiceIdentifier<C>, config: CollectionConfig): C
  {
    let controller = this.injector.get<C>(key);
    this.initializeController(controller, config);
    return controller;
  }

  @activate(o => o instanceof Controller)
  private activateController(controller: Controller): Controller {
    const annotations = getType(controller.constructor).getAnnotations(CollectionAnnotation);

    if (annotations.length !== 0) {
      this.initializeController(controller, annotations[0].config);
    }
    return controller;
  }

  private initializeController(controller: Controller, config: CollectionConfig) {
    const modelName = getType(controller.model).getAnnotations(ModelAnnotation)[0].name;

    this.collections[config.name] = controller;

    let source = config.source
      ? config.source(this.injector, modelName)
      : new NullCollection(config.name + ':source');

    let cache = this.memory.createCollection(config.name, {indices: ['_id']});
    let buffer = this.memory.createCollection(config.name + ':buffer', {indices: ['_id']});

    let cacheWrapper = new CacheCollection(cache, [
      new QueryHashEvaluator(),
      new DocumentIdEvaluator(),
      new RangeEvaluator()
    ]);

    let cachePipe = new RevisionUpsertPipe(cache);
    let validationPipe = new ValidationPipe(this.validator);
    let processor = this.processorFactory.createProcessor<any>()
      .pipe('populate-pre-buffer', 'populate', {
        'validate': validationPipe,
      })
      .pipe('populate-post-buffer', 'populate', {
        'cache': cachePipe
      })
      .pipe('source-upsert', true, {
        'validate': validationPipe,
        'cache': cachePipe
      })
      .pipe('upsert', true, {
        'validate': validationPipe,
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
      .pipe('find.query-cache', 'find', {
        'find-cache': async (q: Query) => {
          return cacheWrapper.find(q.selector, q.options);
        }
      })
      .pipe('find.query-source', 'find', {
        'find-source': async (q: Query) => {
          return source.find(q.selector, q.options);
        }
      })
      .pipe('find.process', 'find', {
        'validate': validationPipe,
        'cache': cachePipe
      });

    for (let middlewareProvider of this.middleware.concat(config.middleware || [])) {
      processor.middleware(middlewareProvider(this.injector, controller));
    }

    controller.initialize(config.name, source, cacheWrapper, buffer, processor);

    if (config.populate) {
      Promise.all(transform(config.populateAfter || [], (result: any, depName: string) => {
        result.push(this.injector.get<Controller>(depName).populate());
      }))
        .then(() => {
          return controller.populate();
        });
    } else {
      controller.locked = false;
    }

    controller.on('ready', () => {
      this.syncedCount += 1;
      if (this.syncedCount === Object.keys(this.collections).length) {
        this.emit('database-synced');
      }
    });

    controller.on('document-upserted', (doc: any) => {
      this.emit('document-upserted', doc, controller);
    });
    controller.on('document-removed', (doc: any) => {
      this.emit('document-removed', doc, controller);
    });
    controller.on('document-error', (err: any) => {
      this.emit('document-error', err, controller);
    });

    return controller;
  }
}
