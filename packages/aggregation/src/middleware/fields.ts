import {Pipe, PipeFactory, IOGate, io} from '@ziqquratu/pipe';
import mingo from 'mingo';

class SetPipeFactory extends PipeFactory {
  public constructor(private config: Record<string, any>) {
    super();
  }

  public async create(): Promise<Pipe> {
    return async (doc: any) => {
      return mingo.aggregate([doc], [{$set: this.config}])[0];
    }
  }
}

class UnsetPipeFactory extends PipeFactory {
  public constructor(private config: Record<string, any>) {
    super();
  }

  public async create(): Promise<Pipe> {
    return async (doc: any) => {
      const clone = Object.assign({}, doc);
      for (const key of Object.keys(this.config)) {
        delete clone[key];
      }
      return clone;
    }
  }
}

export class FieldsAggregator implements IOGate {
  public constructor(private config: Record<string, any>) {}

  get input(): PipeFactory {
    return new UnsetPipeFactory(this.config);
  }

  get output(): PipeFactory {
    return new SetPipeFactory(this.config);
  }
}

export const fields = (config: Record<string, any>) => io(new FieldsAggregator(config));
