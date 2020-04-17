import {Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeFactory, IOGate, io} from '@ziqquratu/pipe';
import {AggregationPipeFactory} from './pipe';

/** Configuration for relatinoship */
export interface RelationshipConfig {
  /** The name of the foreign collection to aggregate from */
  to: string;

  /**
   * The name of the field in this collection whose value should be used to
   * match documents in the foreign collection.
   * 
   * Note that the value of the local field can not be an array, only
   * primitives are allowed.
   */
  localField: string;

  /**
   * The name of the field in the foreign collection that the local field
   * value should be matched against.
   */
  foreignField: string;

  /**
   * The target field in the local collection where the matching documents
   * should be stored.
   * 
   * If not set then 'localField' will be used instead.
   */
  as?: string;

  /**
   * Only link a single document.
   * 
   * If set to true the result will be stored as a single document
   * (the first match), instead of an array of documents.
   * 
   * @default false
   */
  single?: boolean;

  /**
   * Upsert linked documents on store.
   * 
   * If set to true the linked documents from the foreign collection will be
   * upserted when a document in the local collection is stored.
   * 
   * @default true
   */
  upsert?: boolean;
}

export class JoinPipeFactory extends AggregationPipeFactory {
  public constructor(private config: Required<RelationshipConfig>) {
    super();
  }

  public async create(source: Collection, database: Database): Promise<Pipe> {
    const {to, localField, foreignField, as, single} = this.config;
    const foreign = await database.collection(to);

    const $lookup = {from: await foreign.find().toArray(), localField, foreignField, as};
    const $set = {[as]: {$arrayElemAt: ['$' + as, 0]}};

    return super.create(source, database, [{$lookup}, ...single ? [{$set}] : []]);
  }
}

export class SplitPipeFactory extends PipeFactory {
  public constructor(private config: Required<RelationshipConfig>) {
    super();
  }

  public async create(source: Collection, database: Database): Promise<Pipe> {
    const {to, localField, foreignField, upsert} = this.config;
    const foreign = await database.collection(to);

    const asField = this.config.as;

    return async (doc: any) => {
      const clone = Object.assign({}, doc);
      const instance = doc[asField];
      if (asField === localField) {
        if (Array.isArray(instance)) {
          clone[asField] = instance[0][foreignField];
        } else {
          clone[asField] = instance[foreignField];
        }
      } else {
        delete clone[asField];
      }
      if (upsert) {
        for (const o of ([] as any).concat(instance)) {
          await foreign.replaceOne({_id: o._id}, o, {upsert: true});
        }
      }
      return clone;
    }
  }
}

export class RelationshipAggregator implements IOGate {
  public constructor(private config: Required<RelationshipConfig>) {}

  get input() {
    return new SplitPipeFactory(this.config);
  }

  get output() {
    return new JoinPipeFactory(this.config);
  }
}

export const relationship = (config: RelationshipConfig) =>
  io(new RelationshipAggregator(Object.assign({
    as: config.localField,
    single: false,
    upsert: true,
  }, config)));
