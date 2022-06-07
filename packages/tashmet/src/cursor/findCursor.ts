import { Dispatcher, Document, Filter, FindOptions, Namespace } from '../interfaces';
import { AbstractCursor } from './abstractCursor';

export class FindCursor<TSchema extends Document = Document> extends AbstractCursor<TSchema> {
  public constructor(
    namespace: Namespace,
    dispatcher: Dispatcher,
    private filter: Filter<TSchema>,
    options: FindOptions = {},
  ) {
    super(namespace, dispatcher, options);
  }

  protected async initialize(): Promise<Document> {
    return this.dispatcher.dispatch(this.namespace, {
      find: this.namespace.coll,
      filter: this.filter,
      ...this.options
    });
  }
}
