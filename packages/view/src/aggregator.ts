import {Annotation} from '@ziqquratu/core';
import {Aggregator, AggregationPipeline} from '@ziqquratu/database';
import {merge} from 'mingo/util';


export class ViewAggregator extends Aggregator {
  public get pipeline(): AggregationPipeline {
    const mergeSteps = ['$match', '$sort'];
    let pipeline: AggregationPipeline = [];

    for (const annotation of ViewAggregatorAnnotation.onClass(this.constructor, true)) {
      const step = annotation.step(this);

      if (step) {
        const op = (step: object) => Object.keys(step)[0];

        if (pipeline.length > 0) {
          let lastStep = pipeline[pipeline.length - 1];
          if (mergeSteps.includes(op(step)) && op(step) === op(lastStep)) {
            merge(lastStep, step as any);
            continue;
          }
        }
        pipeline.push(step);
      }
    }
    return pipeline;
  }
}

export class ViewAggregatorAnnotation extends Annotation {
  constructor(protected propertyKey: string) { super(); }

  public step(instance: any): object | null {
    return null;
  }
}
