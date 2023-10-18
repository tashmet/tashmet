import { Store } from '@tashmet/bridge';
import { Document } from '../interfaces.js';
import { AggregateOptions } from '../operations/aggregate.js';
import { AggregationCursor } from './aggregationCursor.js';

export class GlobalAggregationCursor<TSchema extends Document = Document> extends AggregationCursor<TSchema> {
  public constructor(
    private collection: Document[],
    store: Store,
    pipeline: Document[],
    options: AggregateOptions = {},
  ) {
    super({db: '__tashmet', coll: ''}, store, pipeline, options);
  }

  protected async initialize(): Promise<Document> {
    return this.store.command(this.namespace, {
      aggregate: this.collection,
      pipeline: this.pipeline,
      ...this.options
    });
  }
}
