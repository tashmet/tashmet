import {injectable} from '@samizdatjs/tiamat';
import {Collection, Document, DocumentConfig} from '../interfaces';
import {Pipeline, HookablePipeline, Validator, MergeDefaults, StripDefaults} from '../pipes';
import {Controller} from './controller';


@injectable()
export class DocumentController extends Controller implements Document {
  private collection: Collection;
  private config: DocumentConfig;

  public constructor() {
    super();
    this.config = Reflect.getOwnMetadata('tashmetu:document', this.constructor);
    const schema = this.config.schema;

    this.pipes['input'] = new HookablePipeline(true)
      .step('validate', new Validator(schema))
      .step('merge',    new MergeDefaults(schema));

    this.pipes['output'] = new HookablePipeline(true)
      .step('strip',    new StripDefaults(schema));

    this.addHooks(this);
  }

  get name(): string {
    return this.config.name;
  }

  public setCollection(collection: Collection): void {
    this.collection = collection;
    const events = [
      'document-upserted',
      'document-removed',
      'document-error'
    ];
    events.forEach((event: string) => {
      collection.on(event, (obj: any) => {
        if (obj._id === this.config.name) {
          this.emit(event, obj);
        }
      });
    });
  }

  public getPipeline(name: string): Pipeline {
    return this.pipes[name];
  }

  public get(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.collection.findOne({_id: this.config.name}, {})
        .then((obj: any) => {
          if (!obj) {
            obj = {_id: this.config.name};
            new MergeDefaults(this.config.schema).process(obj, resolve);
          } else {
            resolve(obj);
          }
        });
    });
  }

  public set(obj: any): Promise<any> {
    return this.collection.upsert(obj);
  }
}
