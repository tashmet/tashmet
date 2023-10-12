import { Dispatcher } from '@tashmet/bridge';
import { Document } from '../interfaces.js';
import { AggregateOptions } from '../operations/aggregate.js';
import { AggregationCursor } from './aggregationCursor.js';

export class GlobalAggregationCursor<TSchema extends Document = Document> extends AggregationCursor<TSchema> {
  public constructor(
    private collection: Document[],
    dispatcher: Dispatcher,
    pipeline: Document[],
    options: AggregateOptions = {},
  ) {
    super({db: '__tashmet', coll: ''}, dispatcher, pipeline, options);
  }

  protected async initialize(): Promise<Document> {
    return this.dispatcher.dispatch(this.namespace, {
      aggregate: this.collection,
      pipeline: this.pipeline,
      ...this.options
    });
  }
}
