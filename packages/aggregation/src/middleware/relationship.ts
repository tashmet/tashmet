import {Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeFactory, IOGate, io} from '@ziqquratu/pipe';
import {AggregationPipeFactory} from './pipe';

export interface RelationshipConfig {
  to: string;
  localField: string;
  foreignField: string;
  as?: string;
  single?: boolean;
}

export class JoinPipeFactory extends AggregationPipeFactory {
  public constructor(private config: Required<RelationshipConfig>) {
    super([]);
  }

  public async create(source: Collection, database: Database): Promise<Pipe> {
    const {to, localField, foreignField, as, single} = this.config;
    const foreign = await database.collection(to);

    const $lookup = {from: await foreign.find().toArray(), localField, foreignField, as};
    const $set = {[localField]: {$arrayElemAt: ['$' + localField, 0]}};

    return super.create(source, database, [{$lookup}, ...single ? [{$set}] : []]);
  }
}

export class SplitPipeFactory extends PipeFactory {
  public constructor(private config: Required<RelationshipConfig>) {
    super();
  }

  public async create(source: Collection, database: Database): Promise<Pipe> {
    const {to, localField} = this.config;
    const foreign = await database.collection(to);

    const joinKey = this.config.as;

    return async (doc: any) => {
      const clone = Object.assign({}, doc);
      const instance = doc[joinKey];
      if (joinKey === localField) {
        if (Array.isArray(instance)) {
          clone[joinKey] = instance.map(o => o._id);
        } else {
          clone[joinKey] = instance._id;
        }
      } else {
        delete clone[joinKey];
      }
      for (const o of ([] as any).concat(instance)) {
        await foreign.replaceOne({_id: o._id}, o, {upsert: true});
      }
      return clone;
    }
  }
}

export class RelationshipAggregator implements IOGate {
  public constructor(private config: Required<RelationshipConfig>) {}

  get input(): PipeFactory {
    return new SplitPipeFactory(this.config);
  }

  get output(): PipeFactory {
    return new JoinPipeFactory(this.config);
  }
}

export const relationship = (config: RelationshipConfig) =>
  io(new RelationshipAggregator(Object.assign({as: config.localField, single: false}, config)));
