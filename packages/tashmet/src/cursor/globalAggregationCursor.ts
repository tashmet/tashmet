import { Dispatcher } from '@tashmet/bridge';
import { Document } from '../interfaces.js';
import { AggregateOptions } from '../operations/aggregate.js';
import { AbstractCursor } from './abstractCursor.js';

export class GlobalAggregationCursor<TSchema extends Document = Document> extends AbstractCursor<TSchema> {
  public constructor(
    private collection: Document[],
    dispatcher: Dispatcher,
    public readonly pipeline: Document[],
    options: AggregateOptions = {},
  ) {
    super({db: '__tashmet', coll: ''}, dispatcher, options);
  }

  protected async initialize(): Promise<Document> {
    return this.dispatcher.dispatch(this.namespace, {
      aggregate: this.collection,
      pipeline: this.pipeline,
      ...this.options
    });
  }
}
