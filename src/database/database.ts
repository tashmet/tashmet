import {inject, provider, activate, bootstrapDone, Injector,
  ServiceIdentifier} from '@ziggurat/tiamat';
import {ModelRegistry, Validator} from '@ziggurat/amelatu';
import {ProcessorFactory} from '@ziggurat/ningal';
import {CollectionFactory, Collection, CollectionType} from '../interfaces';
import {CollectionConfig, Database, DatabaseConfig} from './interfaces';
import {Controller} from './controller';
import {NullCollection} from '../collections/null';
import {EventEmitter} from 'eventemitter3';
import {CollectionAnnotation} from './decorators';

@provider({
  key: 'isimud.Database'
})
export class DatabaseService extends EventEmitter implements Database {
  private collections: {[name: string]: Controller} = {};
  private syncedCount = 0;

  public constructor(
    @inject('isimud.MemoryCollectionFactory') private memory: CollectionFactory,
    @inject('amelatu.ModelRegistry') private models: ModelRegistry,
    @inject('amelatu.Validator') private validator: Validator,
    @inject('ningal.ProcessorFactory') private processorFactory: ProcessorFactory,
    @inject('tiamat.Injector') private injector: Injector,
    @inject('isimud.DatabaseConfig') private config: DatabaseConfig
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

  @activate(Controller)
  private activateController(controller: Controller): Controller {
    const annotation = CollectionAnnotation.onClass(controller.constructor)[0];

    if (annotation) {
      this.initializeController(controller, annotation.config);
    }
    return controller;
  }

  private initializeController(controller: Controller, config: CollectionConfig) {
    const name = this.config.baseUrl + config.name;

    if (name in this.collections) {
      throw new Error(`A collection named '${name}' already exists`);
    }

    this.models.add(controller.model);
    this.collections[name] = controller;

    let source = config.source
      ? config.source(this.injector, config, controller.model)
      : new NullCollection(name + '.source');

    let cache = this.memory.createCollection(config, CollectionType.Cache);
    let buffer = this.memory.createCollection(config, CollectionType.Buffer);

    let processor = this.processorFactory.createProcessor();

    controller.initialize(name, source, cache, buffer, processor, this.validator);

    bootstrapDone(this.injector, () => {
      for (let middlewareProducer of this.config.middleware.concat(config.middleware || [])) {
        processor.middleware(middlewareProducer(this.injector, controller));
      }
    });

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
