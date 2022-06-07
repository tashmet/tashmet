import { Dispatcher, Document, Namespace } from '../interfaces';
import { AggregateOptions } from '../operations/aggregate';
import { AbstractCursor } from './abstractCursor';

export class AggregationCursor<TSchema extends Document = Document> extends AbstractCursor<TSchema> {
  public constructor(
    namespace: Namespace,
    dispatcher: Dispatcher,
    private pipeline: Document[],
    options: AggregateOptions = {},
  ) {
    super(namespace, dispatcher, options);
  }

  protected async initialize(): Promise<Document> {
    return this.dispatcher.dispatch(this.namespace, {
      aggregate: this.namespace.coll,
      pipeline: this.pipeline,
      ...this.options
    });
  }
}
