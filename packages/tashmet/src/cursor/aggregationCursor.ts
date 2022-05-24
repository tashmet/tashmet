import { Dispatcher, Document, Namespace } from '../interfaces';
import { AggregateOptions } from '../operations/aggregate';
import { AbstractCursor } from './abstractCursor';

export class AggregationCursor<TSchema extends Document = Document> extends AbstractCursor<TSchema> {
  public constructor(
    protected ns: Namespace,
    protected dispatcher: Dispatcher,
    private pipeline: Document[],
    options: AggregateOptions = {},
  ) {
    super({}, options);
  }

  protected async fetchAll(): Promise<TSchema[]> {
    const findResult = await this.dispatcher.dispatch(this.ns, {
      aggregate: this.ns.coll,
      pipeline: this.pipeline,
      ...this.options
    });
    return findResult.cursor.firstBatch;
  }
}
