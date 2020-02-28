import {component, provider, Provider} from '@ziqquratu/core';
import {Database} from '@ziqquratu/database';
import {Pipe, PipeFactory, eachDocument} from '@ziqquratu/pipe';
import Ajv from 'ajv';

export interface ValidationConfig {
  collection: string;
}

export class ValidationResult {
  public constructor(
    public readonly success: boolean,
    public readonly errors: Ajv.ErrorObject[]
  ) {}
}

export class AjvError extends Error {
  public constructor(public errors: Ajv.ErrorObject[]) {
    super(errors[0].message);
  }
}

@provider({
  key: 'schema.Validator',
  inject: ['ziqquratu.Database', 'schema.ValidationConfig']
})
export class Validator {
  private ajv: Promise<Ajv.Ajv>;

  public constructor(private database: Database, private config: ValidationConfig) {
    this.ajv = new Promise(resolve => {
      database.collection(config.collection)
        .then(collection => collection.find().toArray())
        .then(docs => resolve(new Ajv().addSchema(docs)));
    });
  }

  public async validate(doc: any, schemaId: string): Promise<any> {
    const validate = (await this.ajv).getSchema(schemaId);
    if (!validate) {
      throw new Error('Could not compile schema: ' + schemaId);
    }
    if (!validate(doc)) {
      throw new AjvError(validate.errors || []);
    }
    return doc;
  }
}

export class ValidationPipeFactory extends PipeFactory {
  public constructor(private schemaId: string) {
    super('schema.Validator');
  }

  public create(): Pipe {
    return this.resolve((validator: Validator) => {
      return async (doc: any) => {
        return validator.validate(doc, this.schemaId);
      }
    })
  }
}

export const schema = (id: string) => eachDocument(
  ['insertOne', 'insertMany', 'replaceOne', 'document-upserted'], new ValidationPipeFactory(id),
);

@component({
  providers: [
    Validator,
    Provider.ofInstance<ValidationConfig>('schema.ValidationConfig', {
      collection: 'schemas'
    }),
  ],
  factories: [ValidationPipeFactory]
})
export default class Schema {}
