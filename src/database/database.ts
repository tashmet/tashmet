import {Newable} from '@ziggurat/meta';
import {provider, bootstrapDone, Container} from '@ziggurat/tiamat';
import {ModelRegistry, Validator} from '@ziggurat/amelatu';
import {ProcessorFactory} from '@ziggurat/ningal';
import {CollectionFactory, Collection, CollectionType} from '../interfaces';
import {CollectionConfig, Database, DatabaseConfig} from './interfaces';
import {Controller} from './controller';
import {NullCollection} from '../collections/null';
import {Document} from '../models/document';
import {EventEmitter} from 'eventemitter3';

@provider({
  key: 'isimud.Database',
  inject: [
    'isimud.MemoryCollectionFactory',
    'amelatu.ModelRegistry',
    'amelatu.Validator',
    'ningal.ProcessorFactory',
    'tiamat.Container',
    'isimud.DatabaseConfig'
  ]
})
export class DatabaseService extends EventEmitter implements Database {
  private collections: {[name: string]: Controller} = {};
  private syncedCount = 0;

  public constructor(
    private memory: CollectionFactory,
    private models: ModelRegistry,
    private validator: Validator,
    private processorFactory: ProcessorFactory,
    private container: Container,
    private config: DatabaseConfig
  ) {
    super();
  }

  public collection(name: string): Collection {
    return this.collections[name];
  }

  public createCollection<C extends Controller<any>>(
    ctr: Newable<C>, config: CollectionConfig): C
  {
    const name = this.config.baseUrl + config.name;

    if (name in this.collections) {
      throw new Error(`A collection named '${name}' already exists`);
    }

    let source = config.source
      ? config.source(this.container, config)
      : new NullCollection(name + '.source');

    let cache = this.memory.createCollection(config, CollectionType.Cache);
    let buffer = this.memory.createCollection(config, CollectionType.Buffer);

    let processor = this.processorFactory.createProcessor();

    let controller = new ctr(
      name, config.model || Document, source, cache, buffer, processor, this.validator
    );

    this.models.add(controller.model);
    this.collections[name] = controller;

    bootstrapDone(this.container, () => {
      for (let middlewareProducer of this.config.middleware.concat(config.middleware || [])) {
        processor.middleware(middlewareProducer(this.container, controller));
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
