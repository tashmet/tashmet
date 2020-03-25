import {Pipe, PipeFactory, eachDocument, PipeHook, PipeFilterHook} from '@ziqquratu/pipe';
import {Validator} from './interfaces';

export enum ValidationFailStrategy {
  /** Pass all documents */
  Pass,
  /** Reject failed documents with error  */
  Error,
  /** Filter passed documents and emit document-error events for failed ones */
  Filter,
};

export interface ValidationPipeOptions {
  /** Strategy to apply to incoming documents (insertOne, insertMany, replaceOne) */
  incoming?: ValidationFailStrategy;

  /** Strategy to apply to outgoing documents (findOne, find) */
  outgoing?: ValidationFailStrategy;
}

export class ValidationPipeFactory extends PipeFactory {
  public constructor(private schemaId: string) {
    super('schema.Validator');
  }

  public async create(): Promise<Pipe> {
    return this.resolve(async (v: Validator) => (doc: any) => v.validate(doc, this.schemaId));
  }
}

export const schema = (id: string, options?: ValidationPipeOptions) => {
  const {incoming, outgoing} = Object.assign({
    incoming: ValidationFailStrategy.Error,
    outgoing: ValidationFailStrategy.Pass,
  }, options);

  let hooks: PipeHook[] = [];
  let filter: PipeFilterHook[] = [];
  if (incoming === ValidationFailStrategy.Error) {
    hooks = hooks.concat(['insertOne', 'insertMany', 'replaceOne']);
  }
  if (outgoing === ValidationFailStrategy.Error) {
    hooks = hooks.concat(['find', 'findOne', 'document-upserted']);
  }
  if (incoming === ValidationFailStrategy.Filter) {
    hooks = hooks.concat(['insertMany']);
    filter = filter.concat(['insertMany']);
  }
  if (outgoing === ValidationFailStrategy.Filter) {
    hooks = hooks.concat(['find', 'findOne']);
    filter = filter.concat(['find', 'findOne']);
  }
  return eachDocument({pipe: new ValidationPipeFactory(id), hooks, filter});
}
