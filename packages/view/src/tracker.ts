import {EventEmitter} from 'eventemitter3';
import {Container, provider, Resolver} from '@tashmit/core';
import {Aggregator, AggregationPipeline, Database, Selector} from '@tashmit/database';
import {Tracker, TrackerConfig} from './interfaces';


export class Tracking extends Resolver<Tracker> {
  public constructor(
    private config: TrackerConfig
  ) { super(); }

  public static of(config: TrackerConfig): Tracking {
    return new Tracking(config);
  }

  public resolve(container: Container) {
    return container.resolve(TrackingFactory)
      .createTracker(Object.assign({monitorDatabase: true}, this.config));
  }
}

export class AggregationTracker<T = any> extends EventEmitter implements Tracker<T> {
  private cachedPipeline: AggregationPipeline = [];

  public constructor(
    private aggregator: Aggregator<T>,
    public collectionName: string,
    private readonly countMatching: boolean,
    private database: Database,
  ) {
    super();
    this.cachedPipeline = aggregator.pipeline;
  }

  public async refresh(aggregator?: Aggregator<T>): Promise<T[]> {
    if (aggregator) {
      this.aggregator = aggregator;
    }
    this.cachedPipeline = this.aggregator.pipeline;
    if (this.cachedPipeline.length > 0) {
      const collection = await this.database.collection(this.collectionName);
      const data = await collection.aggregate<T>(this.cachedPipeline);

      const matchingCount = this.countMatching
        ? await collection.find(this.selector.value).count(false)
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

@provider({
  key: TrackingFactory,
  inject: [Database]
})
export class TrackingFactory {
  private trackers: Tracker<any>[] = [];

  public constructor(private database: Database) {
    database.on('change', ({collection, data}) => {
      this.markDirty(collection.name, data);
    });
  }

  public createTracker<T = any>(config: TrackerConfig): Tracker<T> {
    const tracker = new AggregationTracker<any>(
      config.aggregator,
      config.collection,
      config.countMatching,
      this.database,
    );
    if (config.monitorDatabase) {
      this.trackers.push(tracker);
    }
    return tracker;
  }

  private markDirty(collection: string, docs: any[]) {
    for (const t of this.collectionTrackers(collection)) {
      if (docs.some(doc => t.test(doc))) {
        t.refresh();
      }
    }
  }

  private collectionTrackers(collection: string): Tracker<any>[] {
    return this.trackers.filter(t => t.collectionName === collection);
  }
}
