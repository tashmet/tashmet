import {provider} from '@tashmit/core';
import {Database, DocumentError} from '@tashmit/database';
import {Validator, ValidationConfig} from './interfaces';
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
  key: Validator,
  inject: [Database, ValidationConfig]
})
export class AjvValidator extends Validator {
  private ajv: Promise<Ajv.Ajv>;

  public constructor(database: Database, config: ValidationConfig) {
    super();
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
