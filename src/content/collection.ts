import {injectable} from '@samizdatjs/tiamat';
import {Collection, CollectionConfig, DocumentError, Stream} from './interfaces';
import {Pipeline, DocumentPipe, HookablePipe, Inserter, PersistPipe,
  Validator, MergeDefaults, StripDefaults} from './pipes';
import {DocumentController} from './document';
import {Controller} from './controller';

@injectable()
export class CollectionController extends Controller implements Collection {
  protected cache: Collection;
  private upsertPipe: Pipeline = new Pipeline();
  private persistPipe: PersistPipe = new PersistPipe();
  private insertPipe: Inserter = new Inserter();
  private loadPipe: Pipeline = new Pipeline(true);
  private documentInputPipe: DocumentPipe = new DocumentPipe('input');
  private documentOutputPipe: DocumentPipe = new DocumentPipe('output');

  public constructor() {
    super();
    let config: CollectionConfig = this.getMetaData(this.constructor);
    let schema = config.schema;
    let steps: {[key: string]: HookablePipe} = {
      'insert':   new HookablePipe(this.insertPipe),
      'validate': new HookablePipe(new Validator(schema)),
      'persist':  new HookablePipe(this.persistPipe),
      'merge':    new HookablePipe(new MergeDefaults(schema)),
      'strip':    new HookablePipe(new StripDefaults(schema))
    };

    this.addHooks(steps);

    this.loadPipe
      .step(steps['validate'])
      .step(steps['merge'])
      .step(this.documentInputPipe)
      .step(steps['insert'])
      .on('document-error', (err: DocumentError) => {
        this.emit('document-error', err);
      });

    this.upsertPipe
      .step(this.loadPipe)
      .step(steps['strip'])
      .step(this.documentOutputPipe)
      .step(steps['persist'])
      .on('document-error', (err: DocumentError) => {
        this.emit('document-error', err);
      });
  }

  public setCache(cache: Collection): void {
    this.cache = cache;
    this.insertPipe.setCollection(cache);
  }

  public setStream(stream: Stream<Object>): void {
    this.persistPipe.setStream(stream);
    stream.on('document-added', (doc: any) => {
      this.loadPipe.process(doc, (output: any) => {
        this.emit('document-added', output);
      });
    });
    stream.on('document-changed', (doc: any) => {
      this.loadPipe.process(doc, (output: any) => {
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
    this.upsertPipe.process(obj, (output: any) => {
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
