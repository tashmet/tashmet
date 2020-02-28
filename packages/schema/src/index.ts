import {component, Provider} from '@ziqquratu/core';
import {Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeFactory, eachDocument} from '@ziqquratu/pipe';
import Ajv from 'ajv';

export interface ValidationConfig {
  collection: string;
}

export class AjvError extends Error {
  public constructor(public errors: Ajv.ErrorObject[]) {
    super(errors[0].message);
  }
}

export class ValidationPipeFactory extends PipeFactory {
  public constructor(private schemaId: string) {
    super('schema.ValidationConfig');
  }

  public create(source: Collection, database: Database): Pipe {
    const ajv = new Ajv();
    let validate: Ajv.ValidateFunction | undefined;

    return this.resolve((config: ValidationConfig) => {
      return async (doc: any) => {
        validate = validate || ajv
          .addSchema(await (await database.collection(config.collection)).find().toArray())
          .getSchema(this.schemaId);

        if (!validate) {
          throw new Error('Could not compile schema: ' + this.schemaId);
        }
        if (!validate(doc)) {
          throw new AjvError(validate.errors || []);
        }
        return doc;
      }
    })
  }
}

export const schema = (id: string) => eachDocument(
  ['insertOne', 'insertMany', 'replaceOne', 'document-upserted'], new ValidationPipeFactory(id),
);

@component({
  providers: [
    Provider.ofInstance<ValidationConfig>('schema.ValidationConfig', {
      collection: 'schemas'
    }),
  ],
  factories: [ValidationPipeFactory]
})
export default class Schema {}
