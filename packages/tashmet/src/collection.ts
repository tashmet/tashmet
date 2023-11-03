import {
  AnyBulkWriteOperation,
  BulkWriteResult,
  Document,
  Filter,
  Flatten,
  OptionalId,
  FindOptions,
  ReplaceOneOptions,
  UpdateFilter,
  WithId,
  TashmetProxy,
  PkFactory
} from "./interfaces.js";
import { Database } from './database.js';
import { ChangeStream } from "./changeStream.js";
import { AggregationCursor } from "./cursor/aggregationCursor.js";
import { FindCursor } from "./cursor/findCursor.js";
import {
  BulkWriteOptions,
  InsertManyOperation,
  InsertManyResult,
  InsertOneOperation,
  InsertOneOptions,
  InsertOneResult
} from "./operations/insert.js";
import { DistinctOperation, DistinctOptions } from "./operations/distinct.js";
import {
  DeleteManyOperation,
  DeleteOneOperation,
  DeleteOptions,
  DeleteResult
} from "./operations/delete.js";
import {
  ReplaceOneOperation,
  UpdateManyOperation,
  UpdateOneOperation,
  UpdateResult,
  UpdateOptions
} from "./operations/update.js";
import { CommandOperation } from "./operations/command.js";
import { AggregateOptions } from "./operations/aggregate.js";
import { CountDocumentsOperation, CountDocumentsOptions } from "./operations/countDocuments.js";
import { DropCollectionOperation } from "./operations/drop.js";
import { DEFAULT_PK_FACTORY, TashmetCollectionNamespace } from "./utils.js";

/**
 * A collection of documents.
 */
export class Collection<TSchema extends Document = any> {
  private changeStreams: ChangeStream[] = [];
  private ns: TashmetCollectionNamespace;
  public readonly pkFactory: PkFactory;

  public constructor(
    public readonly collectionName: string,
    private proxy: TashmetProxy,
    public readonly db: Database,
  ) {
    this.pkFactory = DEFAULT_PK_FACTORY;
    this.ns = new TashmetCollectionNamespace(db.databaseName, collectionName);
    this.proxy.on('change', change => {
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
    return this.ns.toString();
  }

  public get fullNamespace(): TashmetCollectionNamespace {
    return this.ns;
  }

  /**
   * Execute an aggregation framework pipeline against the collection
   *
   * @param pipeline - An array of aggregation pipelines to execute
   * @param options - Optional settings for the command
   */
  public aggregate<T extends Document = Document>(
    pipeline: Document[], options: AggregateOptions = {}
  ): AggregationCursor<T> {
    return new AggregationCursor<T>(this.ns, this.proxy, pipeline, options);
  }

  /**
   * Gets the number of documents matching the filter.
   *
   * @param filter - The filter for the count
   * @param options - Optional settings for the command
   */
  public countDocuments(
    filter: Filter<TSchema> = {}, options: CountDocumentsOptions = {}
  ): Promise<number> {
    return this.executeOperation(
      new CountDocumentsOperation(this.ns, filter, options)
    );
  }

  /**
   * Creates a cursor for a filter that can be used to iterate over results from the collection
   *
   * @param filter - The filter predicate. If unspecified, then all documents in the collection will match the predicate
   */
  find(): FindCursor<WithId<TSchema>>;
  find(filter: Filter<TSchema>, options?: FindOptions): FindCursor<WithId<TSchema>>;

  public find(
    filter: Filter<TSchema> = {}, options: FindOptions<TSchema> = {}
  ): FindCursor<WithId<TSchema>> {
    return new FindCursor<WithId<TSchema>>(this.ns, this.proxy, filter, options);
  }

  /**
   * Fetches the first document that matches the filter
   *
   * @param filter - Query for find Operation
   * @param options - Optional settings for the command
   */
  async findOne(): Promise<WithId<TSchema> | null>;
  async findOne(filter: Filter<TSchema>): Promise<WithId<TSchema> | null>;
  async findOne(filter: Filter<TSchema>, options: FindOptions): Promise<WithId<TSchema> | null>;

  public findOne(filter: Filter<TSchema> = {}, options: FindOptions<TSchema> = {}): Promise<WithId<TSchema> | null> {
    return this.find(filter, options).limit(1).next();
  }

  /**
   * Inserts a single document into the collection. If documents passed in do not contain the **_id** field,
   * one will be added to each of the documents missing it by the driver, mutating the document. This behavior
   * can be overridden by setting the **forceServerObjectId** flag.
   *
   * @param doc - The document to insert
   * @param options - Optional settings for the command
   */
  public async insertOne(
    document: OptionalId<TSchema>, options?: InsertOneOptions
  ): Promise<InsertOneResult> {
    return this.executeOperation(
      new InsertOneOperation(this, document, options || {})
    );
  }

  /**
   * Inserts an array of documents into the collection. If documents passed in do not contain the **_id** field,
   * one will be added to each of the documents missing it by the driver, mutating the document. This behavior
   * can be overridden by setting the **forceServerObjectId** flag.
   *
   * @param docs - The documents to insert
   * @param options - Optional settings for the command
   */
  public async insertMany(
    documents: OptionalId<TSchema>[], options?: BulkWriteOptions
  ): Promise<InsertManyResult> {
    return this.executeOperation(
      new InsertManyOperation(this, documents, options || {})
    );
  }

  /**
   * Delete a document from a collection
   *
   * @param filter - The filter used to select the document to remove
   * @param options - Optional settings for the command
   */
  public async deleteOne(
    filter: Filter<TSchema>, options?: DeleteOptions
  ): Promise<DeleteResult> {
    return this.executeOperation(
      new DeleteOneOperation(this.ns, filter, options || {})
    );
  }

  /**
   * Delete multiple documents from a collection
   *
   * @param filter - The filter used to select the documents to remove
   * @param options - Optional settings for the command
   */
  public async deleteMany(
    filter: Filter<TSchema>, options?: DeleteOptions
  ): Promise<DeleteResult> {
    return this.executeOperation(
      new DeleteManyOperation(this.ns, filter, options || {})
    );
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
    return this.executeOperation(
      new ReplaceOneOperation(this.ns, filter, replacement, options || {})
    );
  }

  /**
   * Update a single document in a collection
   *
   * @param filter - The filter used to select the document to update
   * @param update - The update operations to be applied to the document
   * @param options - Optional settings for the command
   */
  public async updateOne(
    filter: Filter<TSchema>, update: UpdateFilter<TSchema>, options?: UpdateOptions
  ): Promise<UpdateResult> {
    return this.executeOperation(
      new UpdateOneOperation(this.ns, filter, update, options || {})
    );
  }

  /**
   * Update multiple documents in a collection
   *
   * @param filter - The filter used to select the documents to update
   * @param update - The update operations to be applied to the documents
   * @param options - Optional settings for the command
   */
  public async updateMany(
    filter: Filter<TSchema>, update: UpdateFilter<TSchema>, options?: UpdateOptions
  ): Promise<UpdateResult> {
    return this.executeOperation(
      new UpdateManyOperation(this.ns, filter, update, options || {})
    );
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
   * @param options - Optional settings for the command
   */
  distinct<Key extends keyof WithId<TSchema>>(
    key: Key
  ): Promise<Array<Flatten<WithId<TSchema>[Key]>>>;
  distinct<Key extends keyof WithId<TSchema>>(
    key: Key,
    filter: Filter<TSchema>
  ): Promise<Array<Flatten<WithId<TSchema>[Key]>>>;
  distinct<Key extends keyof WithId<TSchema>>(
    key: Key,
    filter: Filter<TSchema>,
    options: DistinctOptions
  ): Promise<Array<Flatten<WithId<TSchema>[Key]>>>;

  // Embedded documents overload
  distinct(key: string): Promise<any[]>;
  distinct(key: string, filter: Filter<TSchema>): Promise<any[]>;
  distinct(key: string, filter: Filter<TSchema>, options: DistinctOptions): Promise<any[]>;

  public async distinct<Key extends keyof WithId<TSchema>>(
    key: Key | string,
    filter: Filter<TSchema> = {},
    options: DistinctOptions = {}
  ): Promise<Array<Flatten<WithId<TSchema>[Key]>>> {
    return this.executeOperation(
      new DistinctOperation(this.ns, key as any, filter, options)
    );
  }

  /**
   * Create a new Change Stream, watching for new changes (insertions, updates, replacements, deletions, and invalidations) in this collection.
   *
   * @param pipeline - An array of {@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/|aggregation pipeline stages} through which to pass change stream documents. This allows for filtering (using $match) and manipulating the change stream documents.
   * @param options - Optional settings for the command
   */
  public watch<TLocal extends Document = TSchema>(pipeline: Document[] = []): ChangeStream<TLocal> {
    const cs = new ChangeStream<TLocal>(pipeline, cs => {
      this.changeStreams.splice(this.changeStreams.indexOf(cs), 1);
    });
    this.changeStreams.push(cs);
    return cs;
  }

  /**
   * Drop the collection from the database, removing it permanently. New accesses will create a new collection.
   */
  public drop() {
    return this.executeOperation(new DropCollectionOperation(this.ns, {}));
  }

  private executeOperation<T>(operation: CommandOperation<T>): Promise<T> {
    return operation.execute(this.proxy) as Promise<T>;
  }
}
