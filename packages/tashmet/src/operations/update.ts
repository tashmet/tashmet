import ObjectId from 'bson-objectid';
import { CollationOptions, Document, TashmetProxy } from '../interfaces.js';
import { TashmetCollectionNamespace } from '../utils.js';
import { CommandOperation, CommandOperationOptions } from './command.js';


/** @public */
export interface UpdateOptions extends CommandOperationOptions {
  /** A set of filters specifying to which array elements an update should apply */
  arrayFilters?: Document[];
  /** If true, allows the write to opt-out of document level validation */
  bypassDocumentValidation?: boolean;
  /** Specifies a collation */
  collation?: CollationOptions;
  /** When true, creates a new document if no document matches the query */
  upsert?: boolean;
}

/** @public */
export interface UpdateResult {
  /** Indicates whether this write result was acknowledged. If not, then all other members of this result will be undefined */
  acknowledged: boolean;
  /** The number of documents that matched the filter */
  matchedCount: number;
  /** The number of documents that were modified */
  modifiedCount: number;
  /** The number of documents that were upserted */
  upsertedCount: number;
  /** The identifier of the inserted document if an upsert took place */
  upsertedId: ObjectId;
}

/** @public */
export interface UpdateStatement {
  /** The query that matches documents to update. */
  q: Document;
  /** The modifications to apply. */
  u: Document | Document[];
  /**  If true, perform an insert if no documents match the query. */
  upsert?: boolean;
  /** If true, updates all documents that meet the query criteria. */
  multi?: boolean;
  /** Specifies the collation to use for the operation. */
  collation?: CollationOptions;
  /** An array of filter documents that determines which array elements to modify for an update operation on an array field. */
  arrayFilters?: Document[];
}

/** @internal */
export class UpdateOperation extends CommandOperation<Document> {
  constructor(
    ns: TashmetCollectionNamespace,
    public statements: UpdateStatement[],
    public options: UpdateOptions & { ordered?: boolean }
  ) {
    super(ns, options);
  }

  async execute(proxy: TashmetProxy): Promise<UpdateResult> {
    const options = this.options ?? {};
    const ordered = typeof options.ordered === 'boolean' ? options.ordered : true;
    const command: Document = {
      update: this.ns.collection,
      updates: this.statements,
      ordered
    };

    if (typeof options.bypassDocumentValidation === 'boolean') {
      command.bypassDocumentValidation = options.bypassDocumentValidation;
    }

    const res = await super.executeCommand(proxy, command);
    return {
      acknowledged: true,
      modifiedCount: res.nModified != null ? res.nModified : res.n,
      upsertedId:
        Array.isArray(res.upserted) && res.upserted.length > 0 ? res.upserted[0]._id : null,
      upsertedCount: Array.isArray(res.upserted) && res.upserted.length ? res.upserted.length : 0,
      matchedCount: Array.isArray(res.upserted) && res.upserted.length > 0 ? 0 : res.n
    };
  }
}

/** @internal */
export class UpdateOneOperation extends UpdateOperation {
  constructor(ns: TashmetCollectionNamespace, filter: Document, update: Document, options: UpdateOptions) {
    super(
      ns,
      [makeUpdateStatement(filter, update, { ...options, multi: false })],
      options
    );
  }
}

/** @internal */
export class UpdateManyOperation extends UpdateOperation {
  constructor(ns: TashmetCollectionNamespace, filter: Document, update: Document, options: UpdateOptions) {
    super(
      ns,
      [makeUpdateStatement(filter, update, { ...options, multi: true })],
      options
    );
  }
}

/** @public */
export interface ReplaceOptions extends CommandOperationOptions {
  /** If true, allows the write to opt-out of document level validation */
  bypassDocumentValidation?: boolean;
  /** Specifies a collation */
  collation?: CollationOptions;
  /** When true, creates a new document if no document matches the query */
  upsert?: boolean;
}

/** @internal */
export class ReplaceOneOperation extends UpdateOperation {
  constructor(
    ns: TashmetCollectionNamespace,
    filter: Document,
    replacement: Document,
    options: ReplaceOptions
  ) {
    super(
      ns,
      [makeUpdateStatement(filter, replacement, { ...options, multi: false })],
      options
    );
  }
}

export function makeUpdateStatement(
  filter: Document,
  update: Document,
  options: UpdateOptions & { multi?: boolean }
): UpdateStatement {
  if (filter == null || typeof filter !== 'object') {
    throw new Error('Selector must be a valid JavaScript object');
  }

  if (update == null || typeof update !== 'object') {
    throw new Error('Document must be a valid JavaScript object');
  }

  const op: UpdateStatement = { q: filter, u: update };
  if (typeof options.upsert === 'boolean') {
    op.upsert = options.upsert;
  }

  if (options.multi) {
    op.multi = options.multi;
  }

  if (options.arrayFilters) {
    op.arrayFilters = options.arrayFilters;
  }

  if (options.collation) {
    op.collation = options.collation;
  }

  return op;
}
