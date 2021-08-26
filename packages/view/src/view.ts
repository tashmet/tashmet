import {AggregationPipeline} from '@ziqquratu/database';
import {AggregationBuilder, Tracker} from './interfaces';
import { QueryBuilder } from './query';


/**
 * A view representing a subset of documents within a collection.
 *
 * This class can be extended in order to create a view that tracks documents in a collection
 * based on one or more filters. Filters can be added as members on the view. When the view is
 * refreshed (either manually by calling refresh() or as a consequence of one of its filters
 * having been changed) a selector object and query options are passed through each filter and
 * finally used to query the collection.
 */
export abstract class View<T> extends QueryBuilder {
  public skip = 0;
  public limit: number | undefined;

  public constructor(protected tracker: Tracker<T>) {
    super();
    tracker.pipeline = this.toPipeline();
  }

  /**
   * Manually trigger a refresh of the view.
   */
  public abstract refresh(): Promise<T | T[] | null>;

  public removeAllListeners(event?: string) {
    this.tracker.removeAllListeners(event);
  }
}
