import {Factory} from '@tashmit/core';
import {PipeFactory, eachDocument, PipeHook, PipeFilterHook} from '@tashmit/pipe';
import {Query as MingoQuery} from 'mingo/query';
import {Validator} from './interfaces';

/**
 * Strategies for dealing with validation errors.
 */
export enum ValidationPipeStrategy {
  /**
   * Reject both incoming and outgoing documents with errors.
   */
  Error,

  /**
   * Reject incoming documents with error
   */
  ErrorIn,

  /**
   * Reject incoming documents with error, filter out outgoing documents.
   */
  ErrorInFilterOut,

  /**
   * Filter out both incoming and outgoing documents with errors.
   */
  Filter,

  /**
   * Filter out only incoming documents with errors.
   */
  FilterIn,
};

export type SchemaLookup = Record<string, object>;

export interface ValidationPipeConfig {
  /**
   * Schema to be used
   *
   * The name of the schema or a dictionary where the keys are names of schemas
   * and the values are queries to be tested against the document being
   * validated. The first matching schema will be used. Using this strategy
   * documents with different schemas can be stored in the same collection.
   */
  schema: string | SchemaLookup;

  /**
   * Strategy for dealing with failing documents.
   * @default ValidationPipeStrategy.ErrorIn
   */
  strategy?: ValidationPipeStrategy;
}

export function validationPipe(schema: string | SchemaLookup): PipeFactory {
  const resolveSchema = (doc: any) => {
    if (typeof schema === 'string') {
      return schema;
    }
    for (const [schemaId, filter] of Object.entries(schema)) {
      if (new MingoQuery(filter as any).test(doc)) {
        return schemaId;
      }
    }
    throw Error(`No schema defined for document with ID: '${doc._id}'`);
  }

  return Factory.of(({container}) => {
    const v = container.resolve(Validator);
    return (doc: any) => v.validate(doc, resolveSchema(doc));
  });
}

export const validation = (config: ValidationPipeConfig) => {
  const {schema, strategy} = {strategy: ValidationPipeStrategy.ErrorIn, ...config};

  let hooks: PipeHook[] = [];
  let filter: PipeFilterHook[] = [];

  switch(strategy) {
    case ValidationPipeStrategy.Error:
      hooks = ['insertOneIn', 'insertManyIn', 'replaceOneIn', 'find', 'findOne', 'document-upserted'];
      break;
    case ValidationPipeStrategy.ErrorIn:
      hooks = ['insertOneIn', 'insertManyIn', 'replaceOneIn'];
      break;
    case ValidationPipeStrategy.ErrorInFilterOut:
      hooks = ['insertOneIn', 'insertManyIn', 'replaceOneIn', 'find', 'findOne', 'document-upserted'];
      filter = ['find', 'findOne'];
      break;
    case ValidationPipeStrategy.Filter:
      hooks = ['insertOneIn', 'insertManyIn', 'replaceOneIn', 'find', 'findOne', 'document-upserted'];
      filter = ['insertMany', 'find', 'findOne'];
      break;
    case ValidationPipeStrategy.FilterIn:
      hooks = ['insertOneIn', 'insertManyIn', 'replaceOneIn'];
      filter = ['insertMany'];
      break;
  }
  return eachDocument({pipe: validationPipe(schema), hooks, filter});
}
