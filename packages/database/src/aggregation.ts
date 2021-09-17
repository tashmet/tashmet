import {Aggregator as MingoAggregator} from 'mingo/aggregator';
import {Selector} from './cursor';
import {AggregationPipeline, Database, QueryOptions, SortingMap} from './interfaces';


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

export class Query implements QueryOptions {
  public match: Selector = new Selector();
  public skip: number = 0;
  public limit: number | undefined = undefined;
  public sort: SortingMap | undefined = undefined;

  public static fromPipeline(pipeline: AggregationPipeline): Query {
    let query = new Query();

    const handlers: Record<string, (value: any) => void> = {
      '$match': v => query.match.value = v,
      '$skip': v => query.skip = v,
      '$limit': v => query.limit = v,
      '$sort': v => query.sort = v,
    }

    const handlerOps = Object.keys(handlers);

    for (let i = 0; i < Math.min(pipeline.length, handlerOps.length); i++) {
      const step = pipeline[i];
      const op = Object.keys(step)[0];
      if (op === handlerOps[i]) {
        handlers[op](step[op]);
      } else {
        break;
      }
    }
    return query;
  }
}
