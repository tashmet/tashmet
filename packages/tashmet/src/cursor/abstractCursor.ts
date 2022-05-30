import { Collection } from '../collection';
import { Dispatcher, Document, FindOptions, Namespace, SortingDirection, SortingKey, SortingMap } from '../interfaces';
import { GetMoreOperation } from '../operations/getMore';

/** @public */
export interface AbstractCursorOptions {
  batchSize?: number;
  maxTimeMS?: number;
  /**
   * Comment to apply to the operation.
   *
   * In server versions pre-4.4, 'comment' must be string.  A server
   * error will be thrown if any other type is provided.
   *
   * In server versions 4.4 and above, 'comment' can be any valid BSON type.
   */
  comment?: unknown;
  tailable?: boolean;
  awaitData?: boolean;
  noCursorTimeout?: boolean;
}

/*
export function applyFindOptions(cursor: Cursor<any>, options: FindOptions): Cursor<any> {
  if (options.sort) {
    cursor.sort(options.sort);
  }
  if (options.skip) {
    cursor.skip(options.skip);
  }
  if (options.limit) {
    cursor.limit(options.limit);
  }
  return cursor;
}
*/

export function sortingMap(key: SortingKey, direction?: SortingDirection): SortingMap {
  if (typeof key === 'string') {
    return {[key]: direction || 1};
  }
  if (Array.isArray(key)) {
    return key.reduce((o, k) => Object.assign(o, {[k]: direction || 1}), {});
  }
  return key;
}

export abstract class AbstractCursor<TSchema> {
  protected id: number;
  protected documents: TSchema[] = [];
  protected index = -1;
  protected closed: boolean;
  protected transform: ((doc: TSchema) => any) | undefined;

  public constructor(
    protected collection: Collection,
    protected dispatcher: Dispatcher,
    protected options: AbstractCursorOptions = {}
  ) {}

  [Symbol.asyncIterator](): AsyncIterator<TSchema, void> {
    return {
      next: () =>
        this.next().then(value =>
          value != null ? { value, done: false } : { value: undefined, done: true }
        )
    };
  }

  /**
   * Sets the sort order of the cursor query.
   *
   * If the key is either a string or list of strings the direction will be given by the second
   * argument or default to ascending order.
   *
   * If the key is given as a key-value map the sorting direction for each of the keys will be
   * determined by its value and the direction argument can be omitted.
   */
  public sort(key: SortingKey, direction?: SortingDirection): this {
    return this.extendOptions({sort: sortingMap(key, direction)});
  }

  /** Set the skip for the cursor. */
  public skip(count: number): this {
    return this.extendOptions({skip: count});
  }

  /** Set the limit for the cursor. */
  public limit(count: number): this {
    return this.extendOptions({limit: count});
  }

  /** Returns an array of documents. */
  public async toArray(): Promise<TSchema[]> {
    const docs: TSchema[] = [];
    const transform = this.transform;

    const fetchDocs: () => Promise<TSchema[]> = async () => {
      const doc = await this._next(false);

      if (doc) {
        // NOTE: no need to transform because `next` will do this automatically
        docs.push(doc);

        // these do need to be transformed since they are copying the rest of the batch
        const internalDocs = (
          transform
            ? this.documents.splice(0, this.documents.length).map(transform)
            : this.documents.splice(0, this.documents.length)
        ) as TSchema[];

        if (internalDocs) {
          docs.push(...internalDocs);
        }

        return fetchDocs();
      }

      return docs;
    }

    return fetchDocs();
  }

  /**
   * Get the next available document from the cursor, returns null if no more documents are available
   */
  public async next(): Promise<TSchema | null> {
    return this._next(false);
  };

  public async tryNext(): Promise<TSchema | null> {
    return this._next(false);
  }

  /** Check if there is any document still available in the cursor */
  public async hasNext(): Promise<boolean> {
    if (this.id === 0) {
      return false;
    }

    if (this.documents.length) {
      return true;
    }

    const doc = await this._next(false);
    if (doc) {
      this.documents.unshift(doc);
      return true;
    }

    return false;
  }

  /** Iterates over all the documents for this cursor using the iterator, callback pattern */
  public async forEach(iterator: (doc: TSchema) => void): Promise<void> {
    const transform = this.transform;

    const fetchDocs: () => Promise<void> = async () => {
      const doc = await this._next(false);
        if (doc === null)
          throw Error('');
        let result;
        // NOTE: no need to transform because `next` will do this automatically
        result = iterator(doc); // TODO(NODE-3283): Improve transform typing

        // these do need to be transformed since they are copying the rest of the batch
        const internalDocs = this.documents.splice(0, this.documents.length);
        for (let i = 0; i < internalDocs.length; ++i) {
          try {
            result = iterator(
              (transform ? transform(internalDocs[i]) : internalDocs[i]) as TSchema // TODO(NODE-3283): Improve transform typing
            );
          } catch (error) {
            throw error;
          }
        }

        await fetchDocs();
    };

    await fetchDocs();
  }

  private extendOptions(options: FindOptions): this {
    Object.assign(this.options, options);
    return this;
  }

  protected get namespace(): Namespace {
    return {db: this.collection.dbName, coll: this.collection.collectionName};
  }

  protected async getMore(batchSize: number): Promise<Document> {
    const getMoreOperation = new GetMoreOperation(this.collection, this.id, {
      ...this.options,
      batchSize
    });

    return await getMoreOperation.execute(this.dispatcher);
  }

  protected async _next(blocking: boolean): Promise<TSchema | null> {
    if (this.closed)
      return null;

    if (this.documents && this.documents.length) {
      return this.nextDocument();
    }

    if (this.id == null) {
      const value = await this.init();
      if (value) {
        return value;
      }
      return this._next(blocking);
    }

    /*
    if (cursorIsDead(cursor)) {
      return cleanupCursor(cursor, undefined, () => callback(undefined, null));
    }
    */

    // otherwise need to call getMore
    const batchSize = this.options.batchSize || 1000;
    const response = await this.getMore(batchSize);
    if (response) {
      this.documents = response.cursor.nextBatch;
      this.id = response.cursor.id;
    }

    /*
    if (err || cursorIsDead(cursor)) {
      return cleanupCursor(cursor, { error: err }, () => callback(err, nextDocument<T>(cursor)));
    }
    */

    if (this.documents.length === 0 && !blocking) {
      return null;
    }

    return this._next(blocking);
  }

  protected nextDocument(): TSchema | null {
    if (this.documents == null || !this.documents.length) {
      return null;
    }

    const doc = this.documents.shift();
    if (doc) {
      const transform = this.transform

      return transform ? transform(doc) : doc;
    }

    return null;
  }

  private async init(): Promise<TSchema | null> {
    const response = await this.initialize();
    if (response.cursor) {
      this.id = response.cursor.id;

      if (response.cursor.ns) {
        //this[kNamespace] = ns(response.cursor.ns);
      }

      this.documents = response.cursor.firstBatch;
    }

    return this.nextDocument();
  }

  protected abstract initialize(): Promise<Document>;
}
