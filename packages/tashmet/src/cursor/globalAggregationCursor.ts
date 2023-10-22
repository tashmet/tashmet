import { Document, TashmetProxy } from '../interfaces.js';
import { AggregateOptions } from '../operations/aggregate.js';
import { AggregationCursor } from './aggregationCursor.js';

export class GlobalAggregationCursor<TSchema extends Document = Document> extends AggregationCursor<TSchema> {
  public constructor(
    private collection: Document[],
    proxy: TashmetProxy,
    pipeline: Document[],
    options: AggregateOptions = {},
  ) {
    super({db: '__tashmet', coll: ''}, proxy, pipeline, options);
  }

  protected async initialize(): Promise<Document> {
    return this.proxy.command(this.namespace, {
      aggregate: this.collection,
      pipeline: this.pipeline,
      ...this.options
    });
  }
}
