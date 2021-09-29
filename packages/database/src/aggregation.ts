import {Aggregator as MingoAggregator} from 'mingo/aggregator';
import {Aggregator, AggregationPipeline, Collection, Database, QueryOptions} from './interfaces';

export class QueryAggregator<T> extends Aggregator<T> {
  public constructor(
    public selector: object,
    public options: QueryOptions,
  ) { super(); }

  public static fromPipeline<T = any>(pipeline: AggregationPipeline, strict: boolean = false) {
    let selector: object = {};
    let options: QueryOptions = {};

    const handlers: Record<string, (value: any) => void> = {
      '$match': v => selector = v,
      '$skip': v => options.skip = v,
      '$limit': v => options.limit = v,
      '$sort': v => options.sort = v,
    }

    const handlerOps = Object.keys(handlers);
    let lastOpIndex = 0;

    for (let i = 0; i < pipeline.length; i++) {
      const step = pipeline[i];
      const op = Object.keys(step)[0];
      const opIndex = handlerOps.indexOf(op);
      if (opIndex > lastOpIndex) {
        handlers[op](step[op]);
        lastOpIndex = opIndex;
      } else if (strict) {
        throw new Error('Could not translate pipeline to query');
      } else {
        break;
      }
    }
    return new QueryAggregator<T>(selector, options);
  }

  public get pipeline(): AggregationPipeline {
    const {skip, limit, sort} = this.options;

    return [
      ...(this.selector !== {} ? [{$match: this.selector}] : []),
      ...(skip !== undefined ? [{$skip: skip}] : []),
      ...(limit !== undefined ? [{$limit: limit}] : []),
      ...(sort !== undefined ? [{$sort: sort}] : []),
    ];
  }

  public execute(collection: Collection): Promise<T[]> {
    return collection.find(this.selector, this.options).toArray();
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
