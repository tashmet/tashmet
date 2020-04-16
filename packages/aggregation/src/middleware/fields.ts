import {AggregationPipeline} from '@ziqquratu/database';
import {Pipe, PipeFactory, IOGate, io} from '@ziqquratu/pipe';
import mingo from 'mingo';

export class AggregationPipeFactory extends PipeFactory {
  public constructor(private pipeline: AggregationPipeline) {
    super();
  }

  public async create(): Promise<Pipe> {
    return async doc => mingo.aggregate([doc], this.pipeline)[0];
  }
}

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

  get input(): PipeFactory {
    return new UnsetPipeFactory(Object.keys(this.config));
  }

  get output(): PipeFactory {
    return new SetPipeFactory(this.config);
  }
}

export const fields = (config: Record<string, any>) => io(new FieldsAggregator(config));
