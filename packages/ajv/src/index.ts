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

export class AjvPipe implements Pipe {
  private validate: Ajv.ValidateFunction;

  public constructor(
    private ajv: Ajv.Ajv,
    private database: Database,
    private config: AjvConfig
  ) {}

  public async process(doc: any): Promise<any> {
    if (!this.validate) {
      this.validate = this.ajv.compile(await this.schema());
    }
    if (!this.validate(doc)) {
      throw new AjvError(this.validate.errors || []);
    }
    return doc;
  }

  private schema(): Promise<any> {
    return this.database.collection(this.config.collection).findOne({_id: this.config.schema});
  }
}

export class AjvPipeFactory extends PipeFactory {
  public constructor(private config: AjvConfig) {
    super();
  }

  public create(source: Collection, database: Database): Pipe {
    return new AjvPipe(new Ajv(), database, this.config);
  }
}

export const ajv = (config: AjvConfig) => pipeConnection({
  methods: ['insertOne', 'insertMany', 'replaceOne'],
  events: ['document-upserted'],
  pipe: new AjvPipeFactory(config),
});
