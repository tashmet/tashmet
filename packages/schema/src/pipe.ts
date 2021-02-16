import {Pipe, PipeFactory, eachDocument, PipeHook, PipeFilterHook} from '@ziqquratu/pipe';
import {Validator} from './interfaces';
import mingo from 'mingo';

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

export class ValidationPipeFactory extends PipeFactory {
  public constructor(private schema: string | SchemaLookup) {
    super('schema.Validator');
  }

  public async create(): Promise<Pipe> {
    return this.resolve(async (v: Validator) => (doc: any) => v.validate(doc, this.resolveSchema(doc)));
  }

  private resolveSchema(doc: any): string {
    if (typeof this.schema === 'string') {
      return this.schema;
    }
    for (const schemaId of Object.keys(this.schema)) {
      if (new mingo.Query(this.schema[schemaId] as any).test(doc)) {
        return schemaId;
      }
    }
    throw Error(`No schema defined for document with ID: '${doc._id}'`);
  }
}

export const validation = (config: ValidationPipeConfig) => {
  const {schema, strategy} = Object.assign({
    strategy: ValidationPipeStrategy.ErrorIn,
  }, config);

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
  return eachDocument({pipe: new ValidationPipeFactory(schema), hooks, filter});
}
