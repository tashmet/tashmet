import {getType} from 'reflect-helper';
import {inject, optional, provider, activate, Injector,
  ServiceIdentifier} from '@ziggurat/tiamat';
import {ModelRegistry, ModelAnnotation, Transformer, Validator} from '@ziggurat/mushdamma';
import {Processor, ProcessorFactory, Middleware,
  PipeFunction, Sequence} from '@ziggurat/ningal';
import {CollectionFactory, Collection, MemoryCollectionConfig,
  QueryOptions, Query, CacheQuery} from '../interfaces';
import {CollectionConfig, Database, MiddlewareProvider} from './interfaces';
import {Controller} from './controller';
import {NullCollection} from '../collections/null';
import {EventEmitter} from 'eventemitter3';
import {DocumentIdEvaluator} from '../middleware/caching/documentId';
import {QueryHashEvaluator} from '../middleware/caching/queryHash';
import {RangeEvaluator} from '../middleware/caching/range';
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

    this.models.add(controller.model);
    this.collections[config.name] = controller;

    let source = config.source
      ? config.source(this.injector, modelName)
      : new NullCollection(config.name + ':source');

    let cache = this.memory.createCollection(config.name, {indices: ['_id']});
    let buffer = this.memory.createCollection(config.name + ':buffer', {indices: ['_id']});

    let processor = this.processorFactory.createProcessor();

    controller.initialize(config.name, source, cache, buffer, processor, this.validator);

    config.middleware = (config.middleware || []).concat([
      () => new QueryHashEvaluator(),
      () => new DocumentIdEvaluator(),
      () => new RangeEvaluator()
    ]);

    for (let middlewareProvider of this.middleware.concat(config.middleware || [])) {
      processor.middleware(middlewareProvider(this.injector, controller));
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
