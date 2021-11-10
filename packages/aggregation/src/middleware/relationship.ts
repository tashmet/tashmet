import {Factory} from '@tashmit/core';
import {PipeFactory, io} from '@tashmit/pipe';
import {aggregationPipe} from './pipe';

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

export function joinPipe(config: Required<RelationshipConfig>): PipeFactory {
  return Factory.of(({collection, database, container}) => {
    const {to, localField, foreignField, as, single} = config;
    const $lookup = {from: to, localField, foreignField, as};
    const $set = {[as]: {$arrayElemAt: ['$' + as, 0]}};
    const pipeline = [{$lookup}, ...single ? [{$set}] : []];

    return aggregationPipe(pipeline).resolve(container)({database, collection});
  });
}

export function splitPipe(config: Required<RelationshipConfig>): PipeFactory {
  return Factory.of(({database}) => {
    const {to, localField, foreignField, upsert} = config;
    const foreign = database.collection(to);

    const asField = config.as;

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
  });
}

export const relationship = (config: RelationshipConfig) => {
  const cfg = Object.assign({as: config.localField, single: false, upsert: true}, config);

  return io({
    input: splitPipe(cfg),
    output: joinPipe(cfg),
  });
}
