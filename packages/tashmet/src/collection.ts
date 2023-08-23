import {
  AnyBulkWriteOperation,
  BulkWriteResult,
  Database,
  Document,
  Filter,
  Flatten,
  OptionalId,
  FindOptions,
  ReplaceOneOptions,
  UpdateFilter,
  WithId,
  Dispatcher,
  Namespace,
} from "./interfaces.js";
import { ChangeStream } from "@tashmet/engine";
import { AggregationCursor } from "./cursor/aggregationCursor.js";
import { FindCursor } from "./cursor/findCursor.js";
import { InsertManyOperation, InsertManyResult, InsertOneOperation, InsertOneResult } from "./operations/insert.js";
import { DistinctOperation } from "./operations/distinct.js";
import { DeleteManyOperation, DeleteOneOperation, DeleteResult } from "./operations/delete.js";
import { ReplaceOneOperation, UpdateManyOperation, UpdateOneOperation, UpdateResult } from "./operations/update.js";
import { CommandOperation } from "./operations/command.js";
import { AggregateOptions } from "./operations/aggregate.js";
import { CountDocumentsOperation, CountDocumentsOptions } from "./operations/countDocuments.js";
import { DropCollectionOperation } from "./operations/drop.js";

/**
 * A collection of documents.
 */
export class Collection<TSchema extends Document = any> {
  private changeStreams: ChangeStream[] = [];

  public constructor(
    public readonly collectionName: string,
    private dispatcher: Dispatcher,
    private db: Database,
  ) {
    this.dispatcher.on('change', change => {
      if (change.ns.db === this.dbName && change.ns.coll === this.collectionName) {
        for (const changeStream of this.changeStreams) {
          changeStream.emit('change', change);
        }
      }
    });
  }

  /**
   * The name of the database this collection belongs to
   */
  public get dbName(): string {
    return this.db.databaseName;
  }

  /**
   * The namespace of this collection, in the format `${this.dbName}.${this.collectionName}`
   */
  public get namespace(): string {
    return `${this.dbName}.${this.collectionName}`;
  }

  public aggregate<T extends Document = Document>(pipeline: Document[], options: AggregateOptions = {}): AggregationCursor<T> {
    return new AggregationCursor<T>(this.ns, this.dispatcher, pipeline, options);
  }

  public countDocuments(filter: Filter<TSchema> = {}, options: CountDocumentsOptions = {}): Promise<number> {
    return this.executeOperation(new CountDocumentsOperation(this.ns, filter, options));
  }

  /**
   * Find documents in the collection.
   *
   * @param filter The filter which documents are matched against.
   * @returns A cursor.
   */
  public find(filter: Filter<TSchema> = {}, options: FindOptions<TSchema> = {}): FindCursor<TSchema> {
    return new FindCursor<TSchema>(this.ns, this.dispatcher, filter, options);
  }

  /**
   * Find a single document in the collection.
   *
   * @param selector The selector which documents are matched against.
   * @returns A promise for the first matching document if one was found, null otherwise
   */
  public findOne(filter: Filter<TSchema>, options: FindOptions<TSchema> = {}): Promise<TSchema | null> {
    return this.find(filter, options).limit(1).next();
  }

  /**
   * Insert a document into the collection.
   *
   * If the document passed in do not contain the _id field, one will be added to it
   *
   * @param document The document to insert.
   * @throws Error if a document with the same ID already exists
   */
  public async insertOne(document: OptionalId<TSchema>): Promise<InsertOneResult> {
    return this.executeOperation(new InsertOneOperation(this.ns, document, {}));
  }

  /**
   * Insert multiple documents into the collection
   *
   * If documents passed in do not contain the _id field, one will be added to
   * each of the documents missing it
   *
   * @param documents The documents to insert
   * @throws Error if a document with the same ID already exists
   */
  public async insertMany(documents: OptionalId<TSchema>[]): Promise<InsertManyResult> {
    return this.executeOperation(new InsertManyOperation(this.ns, documents, {}));
  }

  /**
   * Delete a document from a collection
   *
   * @param filter The Filter used to select the document to remove
   */
  public async deleteOne(filter: Filter<TSchema>): Promise<DeleteResult> {
    return this.executeOperation(new DeleteOneOperation(this.ns, filter, {}));
  }

  /**
   * Delete multiple documents from a collection
   *
   * @param filter The Filter used to select the documents to remove
   */
  public async deleteMany(filter: Filter<TSchema>): Promise<DeleteResult> {
    return this.executeOperation(new DeleteManyOperation(this.ns, filter, {}));
  }

  /**
   * Replace a document in a collection with another document
   *
   * @param filter - The filter used to select the document to replace
   * @param replacement - The Document that replaces the matching document
   * @param options - Optional settings for the command
   */
  public async replaceOne(
    filter: Filter<TSchema>, replacement: TSchema, options?: ReplaceOneOptions
  ): Promise<UpdateResult> {
    return this.executeOperation(new ReplaceOneOperation(this.ns, filter, replacement, options || {}));
  }

  /**
   * Update a single document in a collection
   *
   * @param filter - The filter used to select the document to update
   * @param update - The update operations to be applied to the document
   */
  public async updateOne(filter: Filter<TSchema>, update: UpdateFilter<TSchema>): Promise<UpdateResult> {
    return this.executeOperation(new UpdateOneOperation(this.ns, filter, update, {}));
  }

  /**
   * Update multiple documents in a collection
   *
   * @param filter - The filter used to select the documents to update
   * @param update - The update operations to be applied to the documents
   */
  public async updateMany(filter: Filter<TSchema>, update: UpdateFilter<TSchema>): Promise<UpdateResult> {
    return this.executeOperation(new UpdateManyOperation(this.ns, filter, update, {}));
  }

  /**
   * Perform a bulkWrite operation without a fluent API
   *
   * Legal operation types are
   *
   * ```js
   *  { insertOne: { document: { a: 1 } } }
   *
   *  { updateOne: { filter: {a:2}, update: {$set: {a:2}}, upsert:true } }
   *
   *  { updateMany: { filter: {a:2}, update: {$set: {a:2}}, upsert:true } }
   *
   *  { updateMany: { filter: {}, update: {$set: {"a.$[i].x": 5}}, arrayFilters: [{ "i.x": 5 }]} }
   *
   *  { deleteOne: { filter: {c:1} } }
   *
   *  { deleteMany: { filter: {c:1} } }
   *
   *  { replaceOne: { filter: {c:3}, replacement: {c:4}, upsert:true} }
   *```
   *
   * @param operations - Bulk operations to perform
   */
  public async bulkWrite(operations: AnyBulkWriteOperation<TSchema>[]): Promise<BulkWriteResult> {
    throw Error('Not implemented');
  }

  /**
   * The distinct command returns a list of distinct values for the given key across a collection.
   *
   * @param key - Field of the document to find distinct values for
   * @param filter - The filter for filtering the set of documents to which we apply the distinct filter.
   */
  public async distinct<Key extends keyof WithId<TSchema>>(
    key: /*Key | */string,
    filter: Filter<TSchema> = {}
  ): Promise<Array<Flatten<WithId<TSchema>[Key]>>> {
    return this.executeOperation(new DistinctOperation(this.ns, key, filter));
  }

  /**
   * Create a new Change Stream, watching for new changes (insertions, updates, replacements, deletions, and invalidations) in this collection.
   *
   * @param pipeline - An array of {@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/|aggregation pipeline stages} through which to pass change stream documents. This allows for filtering (using $match) and manipulating the change stream documents.
   * @param options - Optional settings for the command
   */
  public watch<TLocal = TSchema>(pipeline: Document[] = []): ChangeStream<TLocal> {
    const cs = new ChangeStream<TLocal>(pipeline, cs => {
      this.changeStreams.splice(this.changeStreams.indexOf(cs), 1);
    });
    this.changeStreams.push(cs);
    return cs;
  }

  public drop() {
    return this.executeOperation(new DropCollectionOperation(this.ns, {}));
  }

  private executeOperation<T>(operation: CommandOperation<T>): Promise<T> {
    return operation.execute(this.dispatcher) as Promise<T>;
  }

  private get ns(): Namespace {
    return {db: this.db.databaseName, coll: this.collectionName};
  }
}
