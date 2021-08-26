import {provider} from '@ziqquratu/core';
import {Database, DocumentError} from '@ziqquratu/database';
import {ValidationConfig} from './interfaces';
import Ajv from 'ajv';

export class AjvError extends DocumentError {
  private static createMessage(doc: any, error: Ajv.ErrorObject) {
    const msg = doc._id === undefined
      ? 'validation failed'
      : `validation of '${doc._id}' failed`;
    return error.dataPath === ''
      ? `${msg}: ${error.message}`
      : `${msg}: '${error.dataPath}' ${error.message}`;
  }

  public constructor(
    doc: any,
    public readonly errors: Ajv.ErrorObject[]
  ) {
    super(doc, AjvError.createMessage(doc, errors[0]));
  }
}

@provider({
  key: 'schema.Validator',
  inject: [Database, 'schema.ValidationConfig']
})
export class AjvValidator {
  private ajv: Promise<Ajv.Ajv>;

  public constructor(database: Database, config: ValidationConfig) {
    this.ajv = new Promise(resolve => {
      database.collection(config.collection)
        .then(collection => collection.find().toArray())
        .then(docs => resolve(new Ajv().addSchema(docs)));
    });
  }

  public async validate(doc: any, schemaId: string): Promise<any> {
    const validate = (await this.ajv).getSchema(schemaId);
    if (!validate) {
      throw new DocumentError(doc, 'could not compile schema: ' + schemaId);
    }
    if (!validate(doc)) {
      throw new AjvError(doc, validate.errors || []);
    }
    return doc;
  }
}
