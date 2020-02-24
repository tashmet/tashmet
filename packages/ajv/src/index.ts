import {Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeFactory, pipeConnection} from '@ziqquratu/pipe';
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
    let validate: Ajv.ValidateFunction;

    return async (doc: any) => {
      if (!validate) {
        validate = ajv.compile(
          await database.collection(this.config.collection).findOne({_id: this.config.schema})
        );
      }
      if (!validate(doc)) {
        throw new AjvError(validate.errors || []);
      }
      return doc;
    }
  }
}

export const ajv = (config: AjvConfig) => pipeConnection({
  methods: ['insertOne', 'insertMany', 'replaceOne'],
  events: ['document-upserted'],
  pipe: new AjvPipeFactory(config),
});
