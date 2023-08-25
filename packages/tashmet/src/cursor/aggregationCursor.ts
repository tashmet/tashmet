import { Dispatcher, Document, Namespace } from '../interfaces.js';
import { AggregateOptions } from '../operations/aggregate.js';
import { AbstractCursor } from './abstractCursor.js';

export class AggregationCursor<TSchema extends Document = Document> extends AbstractCursor<TSchema> {
  public constructor(
    namespace: Namespace,
    dispatcher: Dispatcher,
    public readonly pipeline: Document[],
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

  group<T extends Document = TSchema>($group: Document): AggregationCursor<T> {
    return this.pushStage({$group});
  }

  limit($limit: number): AggregationCursor<TSchema> {
    return this.pushStage({$limit});
  }

  match($match: Document): AggregationCursor<TSchema> {
    return this.pushStage({$match});
  }

  private pushStage<T extends Document = TSchema>(stage: Document): AggregationCursor<T> {
    this.pipeline.push(stage);
    return this as unknown as AggregationCursor<T>;
  }
}
