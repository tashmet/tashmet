import {Pipe, PipeFactory, eachDocument} from '@ziqquratu/pipe';
import {Validator} from './interfaces';

export class ValidationPipeFactory extends PipeFactory {
  public constructor(private schemaId: string) {
    super('schema.Validator');
  }

  public create(): Pipe {
    return this.resolve((v: Validator) => (doc: any) => v.validate(doc, this.schemaId));
  }
}

export const schema = (id: string) => eachDocument(
  ['insertOne', 'insertMany', 'replaceOne', 'document-upserted'], new ValidationPipeFactory(id),
);
