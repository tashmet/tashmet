import {injectable} from '@samizdatjs/tiamat';
import {Collection, Document} from '../interfaces';
import {Pipeline, HookablePipeline, Validator, MergeDefaults, StripDefaults} from '../pipes';
import {Controller} from './controller';
import {DocumentConfig} from './meta/decorators';
import * as Promise from 'bluebird';

@injectable()
export class DocumentController extends Controller implements Document {
  private collection: Collection;
  private config: DocumentConfig;
  private schemas: any[];

  public constructor() {
    super();
    this.config = Reflect.getOwnMetadata('tashmetu:document', this.constructor);
    this.schemas = Reflect.getMetadata('tashmetu:schemas', this.constructor);

    this.pipes['input'] = new HookablePipeline(true)
      .step('validate', new Validator(this.schemas))
      .step('merge',    new MergeDefaults(this.schemas));

    this.pipes['output'] = new HookablePipeline(true)
      .step('strip',    new StripDefaults(this.schemas));

    this.addHooks(this);
  }

  get name(): string {
    return this.config.name;
  }

  public setCollection(collection: Collection): void {
    this.collection = collection;
    collection.on('document-upserted', (obj: any) => {
      if (obj._id === this.config.name) {
        this.emit('document-upserted', obj);
      }
    });
    collection.on('document-removed', (obj: any) => {
      if (obj._id === this.config.name) {
        this.emit('document-removed', obj);
      }
    });
    collection.on('document-error', (obj: any) => {
      if (obj._id === this.config.name) {
        this.emit('document-error', obj);
      }
    });
  }

  public getPipeline(name: string): Pipeline {
    return this.pipes[name];
  }

  public get(): Promise<any> {
    return this.collection.findOne({_id: this.config.name})
      .catch((err: Error) => {
        let doc = {_id: this.config.name};
        let schemas = this.schemas.concat(Reflect.getMetadata(
          'tashmetu:schemas', this.collection.constructor));
        return new MergeDefaults(schemas).process(doc);
    });
  }

  public set(obj: any): Promise<any> {
    return this.collection.upsert(obj);
  }
}
