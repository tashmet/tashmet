import { Document, Namespace, TashmetProxy } from '../interfaces.js';
import { AggregateOptions } from '../operations/aggregate.js';
import { AbstractCursor } from './abstractCursor.js';

export class AggregationCursor<TSchema extends Document = Document> extends AbstractCursor<TSchema> {
  public constructor(
    namespace: Namespace,
    proxy: TashmetProxy,
    public readonly pipeline: Document[],
    options: AggregateOptions = {},
  ) {
    super(namespace, proxy, options);
  }

  protected async initialize(): Promise<Document> {
    return this.proxy.command(this.namespace, {
      aggregate: this.namespace.coll,
      pipeline: this.pipeline,
      ...this.options
    });
  }

  public group<T extends Document = TSchema>($group: Document): AggregationCursor<T> {
    return this.pushStage({$group});
  }

  public limit($limit: number): AggregationCursor<TSchema> {
    return this.pushStage({$limit});
  }

  public match($match: Document): AggregationCursor<TSchema> {
    return this.pushStage({$match});
  }

  public project($project: Document): AggregationCursor<TSchema> {
    return this.pushStage({$project});
  }

  public pushStage<T extends Document = TSchema>(stage: Document): AggregationCursor<T> {
    this.pipeline.push(stage);
    return this as unknown as AggregationCursor<T>;
  }
}
