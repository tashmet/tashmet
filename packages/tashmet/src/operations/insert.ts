import { Document, InferIdType, Namespace } from '../interfaces';
import { CommandOperation, CommandOperationOptions } from './command';


export class InsertOperation extends CommandOperation<Document> {
  constructor(ns: Namespace, public readonly documents: Document[], public readonly options: any) {
    super(ns, options);
  }

  execute(engine: any): Promise<Document> {
    const options = this.options ?? {};
    const ordered = typeof options.ordered === 'boolean' ? options.ordered : true;
    const command: Document = {
      insert: this.ns.coll,
      documents: this.documents,
      ordered
    };

    if (typeof options.bypassDocumentValidation === 'boolean') {
      command.bypassDocumentValidation = options.bypassDocumentValidation;
    }

    // we check for undefined specifically here to allow falsy values
    // eslint-disable-next-line no-restricted-syntax
    if (options.comment !== undefined) {
      command.comment = options.comment;
    }

    return super.executeCommand(engine, command);
  }
}

/** @public */
export interface InsertOneOptions extends CommandOperationOptions {
  /** Allow driver to bypass schema validation in MongoDB 3.2 or higher. */
  bypassDocumentValidation?: boolean;
  /** Force server to assign _id values instead of driver. */
  forceServerObjectId?: boolean;
}

/** @public */
export interface InsertOneResult<TSchema = Document> {
  /** Indicates whether this write result was acknowledged. If not, then all other members of this result will be undefined */
  acknowledged: boolean;
  /** The identifier that was inserted. If the server generated the identifier, this value will be null as the driver does not have access to that data */
  insertedId: InferIdType<TSchema>;
}

export class InsertOneOperation extends InsertOperation {
  constructor(ns: Namespace, doc: Document, options: InsertOneOptions) {
    super(ns, [doc], options);
  }

  async execute(engine: any): Promise<InsertOneResult> {
    const {writeErrors} = await super.execute(engine);
    if (!writeErrors) {
      return {acknowledged: true, insertedId: this.documents[0]._id};
    } else {
      throw new Error(writeErrors[0].errMsg);
    }
  }
}

/** @public */
export interface InsertManyResult<TSchema = Document> {
  /** Indicates whether this write result was acknowledged. If not, then all other members of this result will be undefined */
  acknowledged: boolean;
  /** The number of inserted documents for this operations */
  insertedCount: number;
  /** Map of the index of the inserted document to the id of the inserted document */
  insertedIds: { [key: number]: InferIdType<TSchema> };
}

/** @internal */
export class InsertManyOperation extends InsertOperation {
  constructor(ns: Namespace, docs: Document[], options: any) {
    super(ns, docs, options);
  }

  async execute(engine: any): Promise<InsertManyResult> {
    const {n, ok, writeErrors} = await super.execute(engine);
    if (!writeErrors) {
      return {
        acknowledged: true,
        insertedCount: n,
        insertedIds: this.documents.reduce((acc, doc, index) => {
          acc[index] = doc._id;
          return acc;
        }, {})
      };
    } else {
      throw new Error(writeErrors[0].errMsg);
    }
  }
}
