import { Document, CollationOptions, TashmetProxy } from '../interfaces.js';
import { TashmetCollectionNamespace } from '../utils.js';
import { CommandOperation, CommandOperationOptions } from './command.js';


/** @public */
export interface DeleteOptions extends CommandOperationOptions {
  /** If true, when an insert fails, don't execute the remaining writes. If false, continue with remaining inserts when one fails. */
  ordered?: boolean;
  /** Specifies the collation to use for the operation */
  collation?: CollationOptions;
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
}

/** @internal */
export class DeleteOperation extends CommandOperation<Document> {
  constructor(ns: TashmetCollectionNamespace, protected statements: DeleteStatement[], public options: DeleteOptions) {
    super(ns, options);
  }

  async execute(proxy: TashmetProxy): Promise<DeleteResult> {
    const options = this.options ?? {};
    const ordered = typeof options.ordered === 'boolean' ? options.ordered : true;
    const command: Document = {
      delete: this.ns.collection,
      deletes: this.statements,
      ordered
    };

    const res = await super.executeCommand(proxy, command);
    return {acknowledged: true, deletedCount: res.n};
  }
}

export class DeleteOneOperation extends DeleteOperation {
  constructor(ns: TashmetCollectionNamespace, filter: Document, options: DeleteOptions) {
    super(ns, [makeDeleteStatement(filter, { ...options, limit: 1 })], options);
  }
}

export class DeleteManyOperation extends DeleteOperation {
  constructor(ns: TashmetCollectionNamespace, filter: Document, options: DeleteOptions) {
    super(ns, [makeDeleteStatement(filter, options)], options);
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

  if (options.collation) {
    op.collation = options.collation;
  }

  return op;
}
