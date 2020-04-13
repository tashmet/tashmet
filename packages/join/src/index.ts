import {Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeFactory, IOGate} from '@ziqquratu/pipe';

export interface JoinConfig {
  collection: string;
  key: string;
}

class JoinPipeFactory extends PipeFactory {
  public constructor(private config: JoinConfig) {
    super();
  }

  public async create(source: Collection, database: Database): Promise<Pipe> {
    const foreign = await database.collection(this.config.collection);

    return async (doc: any) => {
      const clone = Object.assign({}, doc);
      const id = doc[this.config.key];
      const value = await foreign.findOne({_id: id});
      clone[this.config.key] = value;
      return clone;
    }
  }
}

class SplitPipeFactory extends PipeFactory {
  public constructor(private config: JoinConfig) {
    super();
  }

  public async create(): Promise<Pipe> {
    return async (doc: any) => {
      const clone = Object.assign({}, doc);
      const id = doc[this.config.key]._id;
      clone[this.config.key] = id;
      return clone;
    }
  }
}

export class JoinGate implements IOGate {
  public constructor(private config: JoinConfig) {}

  get input(): PipeFactory {
    return new SplitPipeFactory(this.config);
  }

  get output(): PipeFactory {
    return new JoinPipeFactory(this.config);
  }
}
