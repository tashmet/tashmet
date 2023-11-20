import { Document, TashmetProxy } from '../interfaces.js';
import { GetMoreOperation } from '../operations/getMore.js';
import { TashmetNamespace } from '../utils.js';

/** @public */
export interface AbstractCursorOptions {
  batchSize?: number;
  maxTimeMS?: number;
  /**
   * Comment to apply to the operation.
   *
   * In proxy versions pre-4.4, 'comment' must be string.  A proxy
   * error will be thrown if any other type is provided.
   *
   * In proxy versions 4.4 and above, 'comment' can be any valid BSON type.
   */
  comment?: unknown;
  tailable?: boolean;
  awaitData?: boolean;
  noCursorTimeout?: boolean;
}

export abstract class AbstractCursor<TSchema> {
  protected id: number;
  protected documents: TSchema[] = [];
  protected index = -1;
  protected closed: boolean;
  protected transform: ((doc: TSchema) => any) | undefined;

  public constructor(
    protected namespace: TashmetNamespace,
    protected proxy: TashmetProxy,
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

  protected async getMore(batchSize: number): Promise<Document> {
    const getMoreOperation = new GetMoreOperation(this.namespace, this.id, {
      ...this.options,
      batchSize
    });

    return await getMoreOperation.execute(this.proxy);
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
