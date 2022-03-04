import {Aggregator, Cursor, Document, Filter, FindOptions} from './interfaces';
import {Collection} from './collection';

export class QueryAggregator<T> extends Aggregator<T> {
  public constructor(
    public filter: Filter<T>,
    public options: FindOptions<T>,
  ) { super(); }

  public static fromPipeline<T = any>(pipeline: Document[], strict: boolean = false) {
    let filter: Filter<T> = {};
    let options: FindOptions<T> = {};

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

  public get pipeline(): Document[] {
    const {skip, limit, sort, projection} = this.options;

    return [
      ...(this.filter !== {} ? [{$match: this.filter}] : []),
      ...(sort !== undefined ? [{$sort: sort}] : []),
      ...(skip !== undefined ? [{$skip: skip}] : []),
      ...(limit !== undefined ? [{$limit: limit}] : []),
      ...(projection !== undefined ? [{$project: projection}] : []),
    ];
  }

  public execute(collection: Collection<T>): Cursor<T> {
    return collection.find(this.filter, this.options);
  }
}
