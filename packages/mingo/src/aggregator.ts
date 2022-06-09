import {
  Document,
  Filter,
  FindOptions,
  provider
} from '@tashmet/tashmet';

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
