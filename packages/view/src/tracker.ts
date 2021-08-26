import {EventEmitter} from 'eventemitter3';
import {Container, provider, Resolver} from '@ziqquratu/core';
import {AggregationPipeline, Collection, Database, Middleware, MiddlewareFactory, Selector} from '@ziqquratu/database';
import {Tracker, TrackerConfig, DocumentTracking} from './interfaces';


export class Tracking extends Resolver<Tracker> {
  public constructor(
    private config: TrackerConfig
  ) { super(); }

  public static of(config: TrackerConfig): Tracking {
    return new Tracking(config);
  }

  public resolve(container: Container) {
    return container.resolve<DocumentTracking>('ziqquratu.DocumentTracking')
      .createTracker(this.config);
  }
}


export class AggregationTracker<T = any> extends EventEmitter implements Tracker<T> {
  public collectionName: string = '';

  public constructor(
    public pipeline: AggregationPipeline,
    private collectionPromise: Promise<Collection>,
    private readonly countMatching: boolean,
  ) {
    super();
    collectionPromise.then(c => this.collectionName = c.name);
  }

  public async refresh(pipeline?: AggregationPipeline): Promise<T[]> {
    if (pipeline) {
      this.pipeline = pipeline;
    }
    if (this.pipeline.length > 0) {
      const collection = await this.collectionPromise;
      const data = await collection.aggregate<T>(this.pipeline).toArray();

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
}

@provider({
  key: 'ziqquratu.DocumentTracking',
  inject: ['ziqquratu.Database']
})
export class DocumentTrackingService implements DocumentTracking {
  private trackers: Tracker<any>[] = [];

  public constructor(private database: Database) {}

  public createTracker<T = any>(config: TrackerConfig): Tracker<T> {
    const tracker = new AggregationTracker<any>(
      config.pipeline,
      this.database.collection(config.collection),
      config.countMatching,
    );
    this.trackers.push(tracker);
    return tracker;
  }

  public markDirty(collection: string, docs: any[]) {
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


export class TrackingMiddlewareFactory extends MiddlewareFactory {
  inject = ['ziqquratu.DocumentTracking'];

  public constructor() { super(); }

  public async create(source: Collection): Promise<Middleware> {
    return this.resolve(async (tracking: DocumentTracking) => {
      const handleInsertDelete = async (next: Function, ...args: any[]) => {
        const result = await next(...args);
        tracking.markDirty(source.name, Array.isArray(result) ? result : [result]);
        return result;
      }

      return {
        methods: {
          insertOne: handleInsertDelete,
          insertMany: handleInsertDelete,
          deleteOne: handleInsertDelete,
          deleteMany: handleInsertDelete,
          replaceOne: async (next, selector, doc, options) => {
            const original = await source.findOne(selector);
            const result = await next(selector, doc, options);
            tracking.markDirty(source.name, [original, result]);
            return result;
          }
        }
      }
    });
  }
}

export const tracking = () => new TrackingMiddlewareFactory();
