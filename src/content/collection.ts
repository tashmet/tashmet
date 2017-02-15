import {injectable} from '@samizdatjs/tiamat';
import {Collection, CollectionConfig, DocumentError, Stream} from './interfaces';
import {Pipeline, DocumentPipe, HookablePipeline, Inserter, PersistPipe,
  Validator, MergeDefaults, StripDefaults} from './pipes';
import {DocumentController} from './document';
import {Controller} from './controller';

@injectable()
export class CollectionController extends Controller implements Collection {
  protected cache: Collection;
  private pipes: {[name: string]: HookablePipeline} = {};
  private cachePipe: Inserter = new Inserter();
  private persistPipe: PersistPipe = new PersistPipe();
  private loadPipe: Pipeline = new Pipeline(true);
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

    this.addHooks(this.pipes);
  }

  public setCache(cache: Collection): void {
    this.cache = cache;
    this.cachePipe.setCollection(cache);
  }

  public setStream(stream: Stream<Object>): void {
    this.persistPipe.setStream(stream);
    stream.on('document-added', (doc: any) => {
      this.pipes['source-added'].process(doc, (output: any) => {
        this.emit('document-added', output);
      });
    });
    stream.on('document-changed', (doc: any) => {
      this.pipes['source-changed'].process(doc, (output: any) => {
        this.emit('document-changed', output);
      });
    });
    stream.on('document-removed', (id: string) => {
      // TODO: Remove document from collection.
    });
    stream.on('ready', () => {
      this.emit('ready');
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
