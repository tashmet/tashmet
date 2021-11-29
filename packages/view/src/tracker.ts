import {EventEmitter} from 'eventemitter3';
import {Container, Resolver} from '@tashmit/core';
import {Aggregator, AggregationPipeline, Database, Selector, Collection} from '@tashmit/database';
import {Tracker, TrackerConfig} from './interfaces';


export class Tracking extends Resolver<Tracker> {
  public constructor(
    private config: TrackerConfig
  ) { super(); }

  public static of(config: TrackerConfig): Tracking {
    return new Tracking(config);
  }

  public resolve(container: Container) {
    const {aggregator, countMatching, monitorDatabase}
      = {monitorDatabase: true, ...this.config};

    const database = container.resolve(Database);
    const collection = database.collection(this.config.collection);

    const tracker = new AggregationTracker<any>(
      aggregator,
      collection,
      countMatching,
    );

    if (monitorDatabase) {
      const cs = collection.watch();
      cs.on('change', ({fullDocument}) => {
        if (!fullDocument || tracker.test(fullDocument)) {
          tracker.refresh();
        }
      });
    }
    return tracker;
  }
}

export class AggregationTracker<T = any> extends EventEmitter implements Tracker<T> {
  private cachedPipeline: AggregationPipeline = [];

  public constructor(
    public aggregator: Aggregator<T> | undefined,
    private collection: Collection<any>,
    private readonly countMatching: boolean,
  ) {
    super();
    this.cachedPipeline = aggregator?.pipeline || [];
  }

  public async refresh(aggregator?: Aggregator<T>): Promise<T[]> {
    if (aggregator) {
      this.aggregator = aggregator;
    }
    this.cachedPipeline = this.aggregator?.pipeline || [];
    if (this.cachedPipeline.length > 0) {
      const data = await this.collection.aggregate<T>(this.cachedPipeline);

      const matchingCount = this.countMatching
        ? await this.collection.find(this.selector.value).count(false)
        : 0;

      this.emit('result-set', data, matchingCount);
      return data;
    }
    return [];
  }

  public test(doc: T): boolean {
    return this.cachedPipeline.length > 0
      ? this.selector.test(doc)
      : false
  }

  public on(event: 'result-set', handler: (resultSet: T[], matchingCount: number) => void) {
    return super.on(event, handler);
  }

  private get selector(): Selector {
    return this.cachedPipeline.length > 0 && '$match' in this.cachedPipeline[0]
      ? new Selector(this.cachedPipeline[0].$match)
      : new Selector();
  }
}
