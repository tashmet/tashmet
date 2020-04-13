import {Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeFactory, IOGate, io} from '@ziqquratu/pipe';

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
      const ref = doc[this.config.key];
      if (Array.isArray(ref)) {
        clone[this.config.key] = await foreign.find({_id: {$in: ref}}).toArray();
      } else {
        clone[this.config.key] = await foreign.findOne({_id: ref});
      }
      return clone;
    }
  }
}

class SplitPipeFactory extends PipeFactory {
  public constructor(private config: JoinConfig) {
    super();
  }

  public async create(source: Collection, database: Database): Promise<Pipe> {
    const foreign = await database.collection(this.config.collection);

    return async (doc: any) => {
      const clone = Object.assign({}, doc);
      const instance = doc[this.config.key];
      if (Array.isArray(instance)) {
        clone[this.config.key] = instance.map(o => o._id);
      } else {
        clone[this.config.key] = instance._id;
      }
      for (const o of ([] as any).concat(instance)) {
        await foreign.replaceOne({_id: o._id}, o, {upsert: true});
      }
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

export const join = (config: JoinConfig) => io(new JoinGate(config));
