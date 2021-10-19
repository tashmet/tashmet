import {Annotation} from '@tashmit/core';
import {Aggregator, AggregationPipeline} from '@tashmit/database';
import {merge} from 'mingo/util';


export class ViewAggregator extends Aggregator {
  public get pipeline(): AggregationPipeline {
    return this.compile(steps => Object.values(steps));
  }

  protected compile(fn: (steps: Record<keyof this, object>) => AggregationPipeline) {
    const mergeSteps = ['$match', '$sort'];
    const steps = ViewAggregatorAnnotation.onClass(this.constructor, true)
      .reduce((steps, a) => {
        const step = a.step(this);
        if (step) {
          steps[a.propertyKey] = step;
        }
        return steps;
      }, {} as any);

    let pipeline: AggregationPipeline = [];
    for (const step of fn(steps || {})) {
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
    return pipeline;
  }
}

export class ViewAggregatorAnnotation extends Annotation {
  constructor(public readonly propertyKey: string) { super(); }

  public step(instance: any): object | null {
    return null;
  }
}
