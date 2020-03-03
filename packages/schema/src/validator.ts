import {provider} from '@ziqquratu/core';
import {Database, DocumentError} from '@ziqquratu/database';
import {ValidationConfig} from './interfaces';
import Ajv from 'ajv';

export class AjvError extends DocumentError {
  public constructor(
    doc: any,
    public readonly errors: Ajv.ErrorObject[]
  ) {
    super(doc, `validation of '${doc._id}' failed: ${errors[0].message}`);
  }
}

@provider({
  key: 'schema.Validator',
  inject: ['ziqquratu.Database', 'schema.ValidationConfig']
})
export class AjvValidator {
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
      throw new AjvError(doc, validate.errors || []);
    }
    return doc;
  }
}
