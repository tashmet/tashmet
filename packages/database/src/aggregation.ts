import mingo from 'mingo';
import {Selector} from './cursor';
import {AggregationPipeline, Database, QueryOptions, SortingMap} from './interfaces';


export async function aggregate<U>(
  pipeline: AggregationPipeline, collection: any[], database: Database): Promise<U[]>
{
  for (const step of pipeline) {
    for (const op of Object.keys(step)) {
      if (op === '$lookup') {
        const foreignCol = await database.collection(step[op].from);
        step[op].from = await foreignCol.find().toArray();
      }
    }
  }
  return mingo.aggregate(collection, pipeline) as U[];
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

    for (const step of pipeline) {
      const op = Object.keys(step)[0];
      if (op in handlers) {
        handlers[op](step[op]);
      } else {
        break;
      }
    }
    return query;
  }
}