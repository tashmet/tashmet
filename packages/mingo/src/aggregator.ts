import {Aggregator as MingoInternalAggregator} from 'mingo/aggregator';
import {
  Aggregator,
  Cursor,
  Document,
  AggregateOptions,
  Lazy,
  Namespace,
  StorageEngine,
  lockedCursor,
  Filter,
  FindOptions,
  provider
} from '@tashmet/tashmet';
import { MingoCursor } from './cursor';
import { MingoStore } from './store';

export interface PrefetchAggregation {
  filter: Filter<any>;
  options: FindOptions<any>;
  pipeline: Document[];
}

@provider()
export class PrefetchAggregationStrategy {
  public create(pipeline: Document[]): PrefetchAggregation {

    let filter: Filter<any> = {};
    let options: FindOptions<any> = {};

    const handlers: Record<string, (value: any) => void> = {
      '$match': v => filter = v,
      '$sort': v => options.sort = v,
      '$skip': v => options.skip = v,
      '$limit': v => options.limit = v,
      '$project': v => options.projection = v,
    }

    const allAllowed = ['$match', '$sort', '$skip', '$limit', '$project'];
    const allowPreceding: Record<string, string[]> = {
      '$match': [],
      '$sort': ['$match'],
      '$skip': allAllowed,
      '$limit': allAllowed,
      '$project': allAllowed,
    };

    let prevStepOps: string[] = [];

    const isValid = (op: string) =>
      op in handlers && prevStepOps.every(prevOp => allowPreceding[op].includes(prevOp));

    for (let i = 0; i < pipeline.length; i++) {
      const step = pipeline[i];
      const op = Object.keys(step)[0];
      if (isValid(op)) {
        handlers[op](step[op]);
        prevStepOps.push(op);
      } else {
        break;
      }
    }

    return {filter, options, pipeline: pipeline.slice(prevStepOps.length)};
  }
}


@provider({
  key: Aggregator,
  inject: [Lazy.of(StorageEngine), PrefetchAggregationStrategy]
})
export class MingoAggregator implements Aggregator {
  public constructor(
    private getEngine: () => StorageEngine,
    private prefetchStrategy: PrefetchAggregationStrategy
  ) {}

  public execute<T = any>(ns: Namespace, pipeline: Document[], options: AggregateOptions = {}): Cursor<T> {
    const mingoOptions = {
      collectionResolver: (name: string) => this.lookupData({db: ns.db, coll: name}),
      collation: options.collation,
    };

    const store = this.getEngine().get(ns);

    if (store instanceof MingoStore) {
      const aggregator = new MingoInternalAggregator(pipeline, mingoOptions);
      return new MingoCursor<T>(aggregator.run(store.documents) as T[]);
    } else {
      const cursor = new MingoCursor<T>([]);
      const aggregate = async () => {
        const s = this.prefetchStrategy.create(pipeline);
        const aggregator = new MingoInternalAggregator(s.pipeline, mingoOptions);
        cursor.setData(aggregator.run(await store.find(s.filter, s.options).toArray()) as any[]);
      }
      return lockedCursor(cursor, aggregate());
    }
  }

  private lookupData(ns: Namespace): Document[] {
    const store = this.getEngine().get(ns);
    if (store instanceof MingoStore) {
      return store.documents;
    }
    throw new Error(`Unable to access data buffer for '${ns.db}.${ns.coll}'`);
  }
}