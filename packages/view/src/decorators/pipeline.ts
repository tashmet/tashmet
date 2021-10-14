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

export function stageDecorator<T>(stage: string, compile?: (value: any, propertyKey: string) => any) {
  return propertyDecorator<T>(
    ({propertyKey}) => new StageAnnotation(propertyKey, stage, compile));
}
