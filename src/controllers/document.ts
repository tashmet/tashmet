import {injectable} from '@samizdatjs/tiamat';
import {Collection, Document} from '../interfaces';
import {Pipeline, HookablePipeline, Validator, MergeDefaults, StripDefaults} from '../pipes';
import {Controller} from './controller';


@injectable()
export class DocumentController extends Controller implements Document {
  private pipes: {[name: string]: HookablePipeline} = {};
  private collection: Collection;
  private config: any;

  public constructor() {
    super();
    this.config = Reflect.getOwnMetadata('tashmetu:document', this.constructor);
    const schema = this.config.schema;

    this.pipes['input'] = new HookablePipeline(true)
      .step('validate', new Validator(schema))
      .step('merge',    new MergeDefaults(schema));

    this.pipes['output'] = new HookablePipeline(true)
      .step('strip',    new StripDefaults(schema));

    this.addHooks(this.pipes);
  }

  get name(): string {
    return this.config.name;
  }

  public setCollection(collection: Collection): void {
    this.collection = collection;
    const events = [
      'document-added',
      'document-changed',
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

  public get(fn: (obj: any) => void): void {
    let self = this;
    this.collection.findOne({_id: this.config.name}, {}, (obj: any) => {
      if (!obj) {
        obj = {_id: this.config.name};
        new MergeDefaults(self.config.schema).process(obj, fn);
      } else {
        fn(obj);
      }
    });
  }

  public set(obj: any): void {
    this.collection.upsert(obj, () => { return; });
  }
}
