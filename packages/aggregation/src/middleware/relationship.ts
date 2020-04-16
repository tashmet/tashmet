import {Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeFactory, IOGate, io} from '@ziqquratu/pipe';

export interface RelationshipConfig {
  to: string;
  localField: string;
  foreignField: string;
  as: string;
}

class JoinPipeFactory extends PipeFactory {
  public constructor(private config: RelationshipConfig) {
    super();
  }

  public async create(source: Collection, database: Database): Promise<Pipe> {
    const foreign = await database.collection(this.config.to);

    return async (doc: any) => {
      const clone = Object.assign({}, doc);
      const ref = doc[this.config.localField];
      if (Array.isArray(ref)) {
        clone[this.config.as] = await foreign.find({[this.config.foreignField]: {$in: ref}}).toArray();
      } else {
        clone[this.config.as] = await foreign.findOne({[this.config.foreignField]: ref});
      }
      return clone;
    }
  }
}

class SplitPipeFactory extends PipeFactory {
  public constructor(private config: RelationshipConfig) {
    super();
  }

  public async create(source: Collection, database: Database): Promise<Pipe> {
    const foreign = await database.collection(this.config.to);

    return async (doc: any) => {
      const clone = Object.assign({}, doc);
      const instance = doc[this.config.as];
      if (this.config.as === this.config.localField) {
        if (Array.isArray(instance)) {
          clone[this.config.as] = instance.map(o => o._id);
        } else {
          clone[this.config.as] = instance._id;
        }
      } else {
        delete clone[this.config.as];
      }
      for (const o of ([] as any).concat(instance)) {
        await foreign.replaceOne({_id: o._id}, o, {upsert: true});
      }
      return clone;
    }
  }
}

export class RelationshipAggregator implements IOGate {
  public constructor(private config: RelationshipConfig) {}

  get input(): PipeFactory {
    return new SplitPipeFactory(this.config);
  }

  get output(): PipeFactory {
    return new JoinPipeFactory(this.config);
  }
}

export const relationship = (config: RelationshipConfig) => io(new RelationshipAggregator(config));
