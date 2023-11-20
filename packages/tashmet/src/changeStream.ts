import {Document, InferIdType, EventEmitter} from './interfaces.js';

export interface ChangeStreamDocument<TSchema extends Document = Document> {
  /**
   * The id functions as an opaque token for use when resuming an interrupted
   * change stream.
   */
  _id: InferIdType<TSchema>;

  /**
   * Describes the type of operation represented in this change notification.
   */
  operationType:
    | 'insert'
    | 'update'
    | 'replace'
    | 'delete'
    | 'invalidate'
    | 'drop'
    | 'dropDatabase'
    | 'rename';

  /**
   * Contains two fields: “db” and “coll” containing the database and
   * collection name in which the change happened.
   */
  ns: { db: string; coll: string };

  /**
   * Only present for ops of type ‘insert’, ‘update’, ‘replace’, and
   * ‘delete’.
   *
   * For unsharded collections this contains a single field, _id, with the
   * value of the _id of the document updated.  For sharded collections,
   * this will contain all the components of the shard key in order,
   * followed by the _id if the _id isn’t part of the shard key.
   */
  documentKey?: { _id: InferIdType<TSchema> };

  /**
   * Only present for ops of type ‘update’.
   *
   * Contains a description of updated and removed fields in this
   * operation.
   */
  updateDescription?: UpdateDescription<TSchema>;

  /**
   * Always present for operations of type ‘insert’ and ‘replace’. Also
   * present for operations of type ‘update’ if the user has specified ‘updateLookup’
   * in the ‘fullDocument’ arguments to the ‘$changeStream’ stage.
   *
   * For operations of type ‘insert’ and ‘replace’, this key will contain the
   * document being inserted, or the new version of the document that is replacing
   * the existing document, respectively.
   *
   * For operations of type ‘update’, this key will contain a copy of the full
   * version of the document from some point after the update occurred. If the
   * document was deleted since the updated happened, it will be null.
   */
  fullDocument?: TSchema;
}

export interface UpdateDescription<TSchema extends Document = Document> {
  /**
   * A document containing key:value pairs of names of the fields that were
   * changed, and the new value for those fields.
   */
  updatedFields: Partial<TSchema>;

  /**
   * An array of field names that were removed from the document.
   */
  removedFields: string[];
}

export interface ChangeStreamEvents<TSchema extends Document> {
  on(event: 'change', fn: (change: ChangeStreamDocument<TSchema>) => void): this;
}

export class ChangeStream<TSchema extends Document = Document>
  extends EventEmitter<any> implements ChangeStreamEvents<TSchema>
{
  private documents: ChangeStreamDocument[] = [];

  public constructor(
    private pipeline: Document[],
    private closeCb: (cs: ChangeStream) => void,
  ) { super(); }

  on(event: 'change', fn: (change: ChangeStreamDocument<TSchema>) => void): this {
    return super.on(event, fn);
  }

  emit(event: 'change', change: ChangeStreamDocument) {
    this.documents.push(change);
    return super.emit(event, change);
  }

  close(): void {
    this.closeCb(this);
  }

  next(): ChangeStreamDocument | undefined {
    return this.documents.shift();
  }

  hasNext(): boolean {
    return this.documents.length > 0;
  }
}
