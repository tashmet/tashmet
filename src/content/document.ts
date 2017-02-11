import {injectable} from '@samizdatjs/tiamat';
import {Collection, Document} from './interfaces';
import {Pipeline, HookablePipe, Validator, MergeDefaults, StripDefaults} from './pipes';
import {Controller} from './controller';


@injectable()
export class DocumentController extends Controller implements Document {
  private inputPipe: Pipeline = new Pipeline();
  private outputPipe: Pipeline = new Pipeline();
  private collection: Collection;
  private config: any;

  public constructor() {
    super();
    const config = Reflect.getOwnMetadata('tashmetu:document', this.constructor);
    const schema = config.schema;

    let steps: {[key: string]: HookablePipe} = {
      'validate': new HookablePipe(new Validator(schema)),
      'merge':    new HookablePipe(new MergeDefaults(schema)),
      'strip':    new HookablePipe(new StripDefaults(schema))
    };

    this.addHooks(steps);

    this.config = config;
    this.inputPipe
      .step(steps['validate'])
      .step(steps['merge']);
    this.outputPipe
      .step(steps['strip']);
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
    switch (name) {
      case 'input':
        return this.inputPipe;
      case 'output':
        return this.outputPipe;
    }
    return new Pipeline();
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
