import {Pipe, PipeFactory, eachDocument} from '@ziqquratu/pipe';
import {Validator} from './interfaces';

export class ValidationPipeFactory extends PipeFactory {
  public constructor(private schemaId: string) {
    super('schema.Validator');
  }

  public async create(): Promise<Pipe> {
    return this.resolve(async (v: Validator) => (doc: any) => v.validate(doc, this.schemaId));
  }
}

export const schema = (id: string) => eachDocument({
  hooks: ['insertOne', 'insertMany', 'replaceOne', 'document-upserted'],
  pipe: new ValidationPipeFactory(id),
});
