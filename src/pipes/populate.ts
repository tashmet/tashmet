import {Pipe, step} from '@ziggurat/ningal';
import {Collection} from '../interfaces';
import {Component, PipeFunction, callable} from '@ziggurat/ningal';

export class PopulatePipe<T> extends Component<object, T[]> {
  @step('cache') private cache: PipeFunction<T>;
  @step('validate') private validate: PipeFunction<T>;

  public constructor(
    private name: string,
    private source: Collection,
    private buffer: Collection,
    cachePipe: Pipe<T>,
    validationPipe: Pipe<T>
  ) {
    super();
    this.cache = callable(cachePipe);
    this.validate = callable(validationPipe);
  }

  public async process(selector: object): Promise<T[]> {
    let docs: any[] = [];
    for (let doc of await this.populateBuffer(await this.source.find())) {
      try {
        docs.push(await this.cache(doc));
      } catch (err) {
        this.emit('document-error', err);
      }
    }
    return docs;
  }

  private async populateBuffer(docs: any[]): Promise<T[]> {
    for (let doc of docs) {
      doc._collection = this.name;
      try {
        await this.buffer.upsert(await this.validate(doc));
      } catch (err) {
        this.emit('document-error', err);
      }
    }
    return this.buffer.find();
  }
}
