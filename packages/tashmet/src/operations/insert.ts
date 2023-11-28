import { Collection } from '../collection.js';
import { TashmetServerError } from '../error.js';
import { Document, InferIdType, TashmetProxy } from '../interfaces.js';
import { CommandOperation, CommandOperationOptions } from './command.js';
import { prepareDocs } from './common.js';


export class InsertOperation extends CommandOperation<Document> {
  constructor(
    private collection: Collection,
    public readonly documents: Document[],
    public readonly options: any
  ) {
    super(collection.fullNamespace, options);
  }

  execute(proxy: TashmetProxy): Promise<Document> {
    const options = this.options ?? {};
    const ordered = typeof options.ordered === 'boolean' ? options.ordered : true;
    const command: Document = {
      insert: this.ns.collection,
      documents: prepareDocs(this.collection, this.documents, this.options),
      ordered
    };

    if (typeof options.bypassDocumentValidation === 'boolean') {
      command.bypassDocumentValidation = options.bypassDocumentValidation;
    }

    return super.executeCommand(proxy, command);
  }
}

/** @public */
export interface InsertOneOptions extends CommandOperationOptions {
  /** Allow driver to bypass schema validation. */
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
  constructor(collection: Collection, doc: Document, options: InsertOneOptions) {
    super(collection, [doc], options);
  }

  async execute(proxy: TashmetProxy): Promise<InsertOneResult> {
    const {writeErrors} = await super.execute(proxy);
    if (!writeErrors) {
      return {acknowledged: true, insertedId: this.documents[0]._id};
    } else {
      throw new TashmetServerError(writeErrors[0].errMsg, writeErrors[0].errInfo);
    }
  }
}

/** @public */
export interface BulkWriteOptions extends CommandOperationOptions {
  /**
   * Allow driver to bypass schema validation.
   * @defaultValue `false` - documents will be validated by default
   **/
  bypassDocumentValidation?: boolean;
  /**
   * If true, when an insert fails, don't execute the remaining writes.
   * If false, continue with remaining inserts when one fails.
   * @defaultValue `true` - inserts are ordered by default
   */
  ordered?: boolean;
  /**
   * Force server to assign _id values instead of driver.
   * @defaultValue `false` - the driver generates `_id` fields by default
   **/
  forceServerObjectId?: boolean;
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
  constructor(collection: Collection, docs: Document[], options: BulkWriteOptions) {
    super(collection, docs, options);
  }

  async execute(proxy: TashmetProxy): Promise<InsertManyResult> {
    const {n, ok, writeErrors} = await super.execute(proxy);
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
