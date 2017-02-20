import {injectable} from '@samizdatjs/tiamat';
import {Collection, CollectionConfig, DocumentError, Pipe} from './interfaces';
import {Pipeline, DocumentPipe, HookablePipeline, UpsertPipe,
  Validator, MergeDefaults, StripDefaults, BufferPipe} from './pipes';
import {DocumentController} from './document';
import {Controller} from './controller';


@injectable()
export class CollectionController extends Controller implements Collection {
  protected cache: Collection;
  protected buffer: Collection;
  private pipes: {[name: string]: HookablePipeline} = {};
  private cachePipe: UpsertPipe = new UpsertPipe();
  private bufferPipe: BufferPipe = new BufferPipe();
  private persistPipe: UpsertPipe = new UpsertPipe();
  private documentInputPipe: DocumentPipe = new DocumentPipe('input');
  private documentOutputPipe: DocumentPipe = new DocumentPipe('output');

  public constructor() {
    super();
    let config: CollectionConfig = this.getMetaData(this.constructor);
    let schema = config.schema;

    this.pipes['source-added'] = new HookablePipeline(true)
      .step('validate', new Validator(schema))
      .step('merge',    new MergeDefaults(schema))
      .push(this.documentInputPipe)
      .step('cache',    this.cachePipe)
      .on('document-error', (err: DocumentError) => {
        this.emit('document-error', err);
      });

    this.pipes['source-changed'] = new HookablePipeline(true)
      .step('validate', new Validator(schema))
      .step('merge',    new MergeDefaults(schema))
      .push(this.documentInputPipe)
      .step('cache',    this.cachePipe)
      .on('document-error', (err: DocumentError) => {
        this.emit('document-error', err);
      });

    this.pipes['upsert'] = new HookablePipeline(true)
      .step('validate', new Validator(schema))
      .step('merge',    new MergeDefaults(schema))
      .push(this.documentInputPipe)
      .step('cache',    this.cachePipe)
      .step('strip',    new StripDefaults(schema))
      .push(this.documentOutputPipe)
      .step('persist',  this.persistPipe)
      .on('document-error', (err: DocumentError) => {
        this.emit('document-error', err);
      });

    this.pipes['populate'] = new HookablePipeline(true)
      .step('validate', new Validator(schema))
      .step('merge',    new MergeDefaults(schema))
      .push(this.documentInputPipe)
      .step('buffer',   this.bufferPipe)
      .step('cache',    this.cachePipe)
      .on('document-error', (err: DocumentError) => {
        this.emit('document-error', err);
      });

    this.addHooks(this.pipes);
  }

  public setBuffer(buffer: Collection): void {
    this.buffer = buffer;
    this.bufferPipe.setCollection(buffer);
  }

  public setCache(cache: Collection): void {
    const events = [
      'document-upserted',
      'document-removed'
    ];
    events.forEach((event: string) => {
      cache.on(event, (obj: any) => {
        this.emit(event, obj);
      });
    });
    this.cache = cache;
    this.cachePipe.setCollection(cache);

    let cacheCount = 0;
    cache.on('document-upserted', (doc: any) => {
      cacheCount += 1;
      if (cacheCount >= this.bufferPipe.getCount()) {
        this.emit('ready');
      }
    });
  }

  public setSource(source: Collection): void {
    this.persistPipe.setCollection(source);

    source.on('document-upserted', (doc: any) => {
      this.pipes['source-upsert'].process(doc, (output: any) => { return; });
    });
    source.on('document-removed', (id: string) => {
      // TODO: Remove document from collection.
    });

    this.pipes['populate'].on('document-error', (err: DocumentError) => {
      this.bufferPipe.decCount();
    });

    source.find({}, {}, (docs: any[]) => {
      this.bufferPipe.setCount(Object.keys(docs).length);
      docs.forEach((doc: any) => {
        this.pipes['populate'].process(doc, (output: any) => { return; });
      });
    });
  }

  public addDocumentController(doc: DocumentController): void {
    this.documentInputPipe.addController(doc);
    this.documentOutputPipe.addController(doc);
  }

  public find(filter: Object, options: Object, fn: (result: any) => void): void {
    this.cache.find(filter, options, fn);
  }

  public findOne(filter: Object, options: Object, fn: (result: any) => void): void {
    this.cache.findOne(filter, options, fn);
  }

  public upsert(obj: any, fn: () => void): void {
    this.pipes['upsert'].process(obj, (output: any) => {
      this.emit('document-added', obj);
      fn();
    });
  }

  public name(): string {
    return this.cache.name();
  }

  private getMetaData(constructor: any): CollectionConfig {
    return Reflect.getOwnMetadata('tashmetu:collection', constructor);
  }
}
