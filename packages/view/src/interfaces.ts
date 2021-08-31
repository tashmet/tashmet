import {AggregationPipeline} from '@ziqquratu/database';

export interface AggregationBuilder {
  toPipeline(): AggregationPipeline;
}

export interface TrackerConfig {
  collection: string;
  pipeline: AggregationPipeline;

  /**
   * If set to true, count the documents that are matched by the inital $match
   * step of the pipeline if there is one.
   */
  countMatching: boolean;

  /**
   * Listen for changes in the database that will affect the results of the
   * pipeline and refresh automatically when they happen.
   *
   * @default true
   */
  monitorDatabase?: boolean;
}

export interface Tracker<T = any> {
  readonly collectionName: string;
  pipeline: AggregationPipeline;

  refresh(pipeline?: AggregationPipeline): Promise<T[]>;

  /**
   * Test if an input document is affecting the output of the aggregation
   * pipeline being tracked.
   *
   * @param doc
   */
  test(doc: T): boolean;

  on(event: 'result-set', handler: (resultSet: T[], matchingCount: number) => void): Tracker<T>;
  removeAllListeners(event?: string): void;
}
