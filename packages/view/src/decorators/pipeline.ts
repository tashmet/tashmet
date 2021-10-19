import {propertyDecorator} from '@tashmit/core';
import {ViewAggregatorAnnotation} from '../aggregator';

export class StageAnnotation extends ViewAggregatorAnnotation {
  public constructor(
    propertyKey: string,
    private stage: string,
    private compile?: (value: any, propertyKey: string) => any,
  ) { super(propertyKey); }

  public step(instance: any) {
    const value = instance[this.propertyKey];
    if (value !== undefined) {
      return {[this.stage]: this.compile ? this.compile(value, this.propertyKey) : value};
    }
    return null;
  }
}

export type StageCompile<T, ResultT = any> = (value: T, propertyKey: string) => ResultT;

export function stageDecorator<T, ResultT = any>(stage: string, compile?: StageCompile<T, ResultT>) {
  return propertyDecorator<T>(
    ({propertyKey}) => new StageAnnotation(propertyKey, stage, compile));
}
