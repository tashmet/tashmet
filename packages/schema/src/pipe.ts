import {Pipe, PipeFactory, eachDocument, PipeHook, PipeFilterHook} from '@ziqquratu/pipe';
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

export interface ValidationPipeConfig {
  /** Schema ID */
  schema: string;

  /**
   * Strategy for dealing with failing documents.
   * @default ValidationPipeStrategy.ErrorIn
   */
  strategy?: ValidationPipeStrategy;
}

export class ValidationPipeFactory extends PipeFactory {
  public constructor(private schemaId: string) {
    super('schema.Validator');
  }

  public async create(): Promise<Pipe> {
    return this.resolve(async (v: Validator) => (doc: any) => v.validate(doc, this.schemaId));
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
