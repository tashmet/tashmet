import { Dispatcher, Document, Filter, FindOptions, Namespace } from '../interfaces';
import { AbstractCursor } from './abstractCursor';

export class FindCursor<TSchema extends Document = Document> extends AbstractCursor<TSchema> {
  public constructor(
    protected ns: Namespace,
    protected dispatcher: Dispatcher,
    filter: Filter<TSchema>,
    options: FindOptions = {},
  ) {
    super(filter, options);
  }

  protected async fetchAll(): Promise<TSchema[]> {
    const findResult = await this.dispatcher.dispatch(this.ns, {find: this.ns.coll, filter: this.filter, ...this.options});
    return findResult.cursor.firstBatch;
  }
}
