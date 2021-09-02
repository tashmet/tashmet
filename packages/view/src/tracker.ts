import {EventEmitter} from 'eventemitter3';
import {Container, provider, Resolver} from '@ziqquratu/core';
import {AggregationPipeline, Database, Selector} from '@ziqquratu/database';
import {AbstractAggregator, Tracker, TrackerConfig} from './interfaces';


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
  public constructor(
    public aggregator: AbstractAggregator<T>,
    public collectionName: string,
    private readonly countMatching: boolean,
    private database: Database,
  ) {
    super();
  }

  public async refresh(aggregator?: AbstractAggregator<T>): Promise<T[]> {
    if (aggregator) {
      this.aggregator = aggregator;
    }
    if (this.pipeline.length > 0) {
      const collection = await this.database.collection(this.collectionName);
      const data = await this.aggregator.execute(collection);

      const matchingCount = this.countMatching
        ? await collection.find(this.selector.value).count(false)
        : 0;

      this.emit('result-set', data, matchingCount);
      return data;
    }
    return [];
  }

  public test(doc: T): boolean {
    return this.pipeline.length > 0
      ? this.selector.test(doc)
      : false
  }

  public on(event: 'result-set', handler: (resultSet: T[], matchingCount: number) => void) {
    return super.on(event, handler);
  }

  private get selector(): Selector {
    return this.pipeline.length > 0 && '$match' in this.pipeline[0]
      ? new Selector(this.pipeline[0].$match)
      : new Selector();
  }

  private get pipeline(): AggregationPipeline {
    return this.aggregator.pipeline;
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
