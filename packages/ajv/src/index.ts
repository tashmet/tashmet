import {Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeFactory, eachDocument} from '@ziqquratu/pipe';
import Ajv from 'ajv';

export interface AjvConfig {
  collection: string;

  schema: string;
}

export class AjvError extends Error {
  public constructor(public errors: Ajv.ErrorObject[]) {
    super(errors[0].message);
  }
}

export class AjvPipeFactory extends PipeFactory {
  public constructor(private config: AjvConfig) {
    super();
  }

  public create(source: Collection, database: Database): Pipe {
    const ajv = new Ajv();
    let validate: Ajv.ValidateFunction | undefined;

    return async (doc: any) => {
      validate = validate || ajv
        .addSchema(await database.collection(this.config.collection).find().toArray())
        .getSchema(this.config.schema);
      if (!validate) {
        throw new Error('Could not compile schema: ' + this.config.schema);
      }
      if (!validate(doc)) {
        throw new AjvError(validate.errors || []);
      }
      return doc;
    }
  }
}

export const ajv = (config: AjvConfig) => eachDocument(
  ['insertOne', 'insertMany', 'replaceOne', 'document-upserted'], new AjvPipeFactory(config),
);
