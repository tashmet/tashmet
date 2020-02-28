import {component, Provider} from '@ziqquratu/core';
import {Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeFactory, eachDocument} from '@ziqquratu/pipe';
import Ajv from 'ajv';

export interface AjvConfig {
  schema: string;
}

export interface ValidatorConfig {
  collection: string;
}

export class AjvError extends Error {
  public constructor(public errors: Ajv.ErrorObject[]) {
    super(errors[0].message);
  }
}

export class AjvPipeFactory extends PipeFactory {
  public constructor(private config: AjvConfig) {
    super('ajv.ValidatorConfig');
  }

  public create(source: Collection, database: Database): Pipe {
    const ajv = new Ajv();
    let validate: Ajv.ValidateFunction | undefined;

    return this.resolve((config: ValidatorConfig) => {
      return async (doc: any) => {
        validate = validate || ajv
          .addSchema(await (await database.collection(config.collection)).find().toArray())
          .getSchema(this.config.schema);

        if (!validate) {
          throw new Error('Could not compile schema: ' + this.config.schema);
        }
        if (!validate(doc)) {
          throw new AjvError(validate.errors || []);
        }
        return doc;
      }
    })
  }
}

export const ajv = (config: AjvConfig) => eachDocument(
  ['insertOne', 'insertMany', 'replaceOne', 'document-upserted'], new AjvPipeFactory(config),
);

@component({
  providers: [
    Provider.ofInstance<ValidatorConfig>('ajv.ValidatorConfig', {
      collection: 'schemas'
    }),
  ],
  factories: [AjvPipeFactory]
})
export default class AjvComponent {}
