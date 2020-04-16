import {Pipe, PipeFactory, IOGate, io} from '@ziqquratu/pipe';
import mingo from 'mingo';

export class SetPipeFactory extends PipeFactory {
  public constructor(private config: Record<string, any>) {
    super();
  }

  public async create(): Promise<Pipe> {
    return async (doc: any) => {
      return mingo.aggregate([doc], [{$set: this.config}])[0];
    }
  }
}

export class UnsetPipeFactory extends PipeFactory {
  private projection: Record<string, 0>;

  public constructor(keys: string[]) {
    super();
    this.projection = keys.reduce((acc, key) => Object.assign(acc, {[key]: 0}), {});
  }

  public async create(): Promise<Pipe> {
    return async (doc: any) => {
      return mingo.aggregate([doc], [{$project: this.projection}])[0];
    }
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
