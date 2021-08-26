import {getType} from 'reflect-helper';
import {Annotation} from '@ziqquratu/core';
import {AggregationPipeline, Query} from '@ziqquratu/database';
import {AggregationBuilder} from './interfaces';


export class QueryBuilder implements AggregationBuilder {
  public toPipeline(): AggregationPipeline {
    let query = new Query();

    for (const annotation of QueryPropertyAnnotation.onClass(this.constructor, true)) {
      annotation.apply(query, this);
    }

    let pipeline: AggregationPipeline = [];

    if (Object.keys(query.match.value).length > 0) {
      pipeline.push({$match: query.match.value});
    }
    if (query.sort) {
      pipeline.push({$sort: query.sort});
    }
    if (query.skip > 0) {
      pipeline.push({$skip: query.skip});
    }
    if (query.limit) {
      pipeline.push({$limit: query.limit});
    }
    return pipeline;
  }
}

export class QueryPropertyAnnotation extends Annotation {
  constructor(protected propertyKey: string) { super(); }

  public apply(query: Query, value: any): void {
    return;
  }
}
