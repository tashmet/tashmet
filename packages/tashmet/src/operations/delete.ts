import { Collection } from '../collection';
import { Document, CollationOptions, Dispatcher } from '../interfaces';
import { CommandOperation, CommandOperationOptions } from './command';


/** @public */
export interface DeleteOptions extends CommandOperationOptions {
  /** If true, when an insert fails, don't execute the remaining writes. If false, continue with remaining inserts when one fails. */
  ordered?: boolean;
  /** Specifies the collation to use for the operation */
  collation?: CollationOptions;
  /** Specify that the update query should only consider plans using the hinted index */
  hint?: string | Document;
  /** Map of parameter names and values that can be accessed using $$var (requires MongoDB 5.0). */
  let?: Document;

  /** @deprecated use `removeOne` or `removeMany` to implicitly specify the limit */
  single?: boolean;
}

/** @public */
export interface DeleteResult {
  /** Indicates whether this write result was acknowledged. If not, then all other members of this result will be undefined. */
  acknowledged: boolean;
  /** The number of documents that were deleted */
  deletedCount: number;
}

/** @public */
export interface DeleteStatement {
  /** The query that matches documents to delete. */
  q: Document;
  /** The number of matching documents to delete. */
  limit: number;
  /** Specifies the collation to use for the operation. */
  collation?: CollationOptions;
  /** A document or string that specifies the index to use to support the query predicate. */
  //hint?: Hint;
}

/** @internal */
export class DeleteOperation extends CommandOperation<Document> {
  constructor(collection: Collection, protected statements: DeleteStatement[], public options: DeleteOptions) {
    super(collection, options);
  }

  async execute(dispatcher: Dispatcher): Promise<DeleteResult> {
    const options = this.options ?? {};
    const ordered = typeof options.ordered === 'boolean' ? options.ordered : true;
    const command: Document = {
      delete: this.collection.collectionName,
      deletes: this.statements,
      ordered
    };

    if (options.let) {
      command.let = options.let;
    }

    const res = await super.executeCommand(dispatcher, command);
    return {acknowledged: true, deletedCount: res.n};
  }
}

export class DeleteOneOperation extends DeleteOperation {
  constructor(collection: Collection, filter: Document, options: DeleteOptions) {
    super(collection, [makeDeleteStatement(filter, { ...options, limit: 1 })], options);
  }
}

export class DeleteManyOperation extends DeleteOperation {
  constructor(collection: Collection, filter: Document, options: DeleteOptions) {
    super(collection, [makeDeleteStatement(filter, options)], options);
  }
}

export function makeDeleteStatement(
  filter: Document,
  options: DeleteOptions & { limit?: number }
): DeleteStatement {
  const op: DeleteStatement = {
    q: filter,
    limit: typeof options.limit === 'number' ? options.limit : 0
  };

  if (options.single === true) {
    op.limit = 1;
  }

  if (options.collation) {
    op.collation = options.collation;
  }

  return op;
}
