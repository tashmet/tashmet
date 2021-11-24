import {Aggregator as MingoAggregator} from 'mingo/aggregator';
import { UpdateFilter } from '.';
import {
  Aggregator, AggregationPipeline, Database, Filter, QueryOptions
} from './interfaces';
import { Collection } from './collection';

export class QueryAggregator<T> extends Aggregator<T> {
  public constructor(
    public filter: Filter<T>,
    public options: QueryOptions<T>,
  ) { super(); }

  public static fromPipeline<T = any>(pipeline: AggregationPipeline, strict: boolean = false) {
    let filter: Filter<T> = {};
    let options: QueryOptions<T> = {};

    const handlers: Record<string, (value: any) => void> = {
      '$match': v => filter = v,
      '$sort': v => options.sort = v,
      '$skip': v => options.skip = v,
      '$limit': v => options.limit = v,
      '$project': v => options.projection = v,
    }

    const allowPreceding: Record<string, string[]> = {
      '$match': [],
      '$sort': ['$match'],
      '$skip': ['$match', '$sort', '$skip', '$limit', '$project'],
      '$limit': ['$match', '$sort', '$skip', '$limit', '$project'],
      '$project': ['$match', '$sort', '$skip', '$limit', '$project'],
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
      } else if (strict) {
        throw new Error('Could not translate pipeline to query');
      } else {
        break;
      }
    }
    return new QueryAggregator<T>(filter, options);
  }

  public get pipeline(): AggregationPipeline {
    const {skip, limit, sort, projection} = this.options;

    return [
      ...(this.filter !== {} ? [{$match: this.filter}] : []),
      ...(sort !== undefined ? [{$sort: sort}] : []),
      ...(skip !== undefined ? [{$skip: skip}] : []),
      ...(limit !== undefined ? [{$limit: limit}] : []),
      ...(projection !== undefined ? [{$project: projection}] : []),
    ];
  }

  public execute(collection: Collection<T>): Promise<T[]> {
    return collection.find(this.filter, this.options).toArray();
  }
}

export async function aggregate<U>(
  pipeline: AggregationPipeline, collection: any[], database: Database): Promise<U[]>
{
  for (const step of pipeline) {
    for (const op of Object.keys(step)) {
      if (op === '$lookup' && typeof step[op].from === 'string') {
        const foreignCol = await database.collection(step[op].from);
        step[op].from = await foreignCol.find().toArray();
      }
    }
  }
  return new MingoAggregator(pipeline).run(collection) as U[];
}

export function updateMany<T>(input: T[], update: UpdateFilter<T>): T[] {
  const pipeline = Object.entries(update).reduce((acc, [k, v]) => {
    return acc.concat([{[k]: v}]);
  }, [] as AggregationPipeline);
  return new MingoAggregator(pipeline).run(input) as T[];
}

export function updateOne<T>(input: T, update: UpdateFilter<T>): T {
  return updateMany([input], update)[0];
}
