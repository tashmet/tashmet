import {Annotation} from '@ziqquratu/core';
import {AggregationPipeline} from '@ziqquratu/database';
import {AbstractAggregator} from './interfaces';

const assignDeep = require('assign-deep');

export class Aggregator extends AbstractAggregator {
  public get pipeline(): AggregationPipeline {
    const mergeSteps = ['$match', '$sort'];
    let pipeline: AggregationPipeline = [];

    for (const annotation of AggregatorAnnotation.onClass(this.constructor, true)) {
      const step = annotation.step(this);

      if (step) {
        const op = (step: object) => Object.keys(step)[0];

        if (pipeline.length > 0) {
          let lastStep = pipeline[pipeline.length - 1];
          if (mergeSteps.includes(op(step)) && op(step) === op(lastStep)) {
            assignDeep(lastStep, step);
            continue;
          }
        }
        pipeline.push(step);
      }
    }
    return pipeline;
  }
}

export class AggregatorAnnotation extends Annotation {
  constructor(protected propertyKey: string) { super(); }

  public step(instance: any): object | null {
    return null;
  }
}
