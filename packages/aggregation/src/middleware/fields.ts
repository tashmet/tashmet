import {IOGate, io} from '@tashmit/pipe';
import {AggregationPipeFactory} from './pipe';

export class SetPipeFactory extends AggregationPipeFactory {
  public constructor(config: Record<string, any>) {
    super([{$set: config}]);
  }
}

export class UnsetPipeFactory extends AggregationPipeFactory {
  public constructor(keys: string[]) {
    super([
      {$project: keys.reduce((acc, key) => Object.assign(acc, {[key]: 0}), {})}
    ]);
  }
}

export class FieldsAggregator implements IOGate {
  public constructor(private config: Record<string, any>) {}

  get input() {
    return new UnsetPipeFactory(Object.keys(this.config));
  }

  get output() {
    return new SetPipeFactory(this.config);
  }
}

export const fields = (config: Record<string, any>) => io(new FieldsAggregator(config));
