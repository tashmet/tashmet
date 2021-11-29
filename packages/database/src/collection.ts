import {
  AnyBulkWriteOperation,
  BulkWriteResult,
  CollectionDriver,
  Cursor,
  Document,
  DeleteResult,
  Filter,
  Flatten,
  InsertManyResult,
  InsertOneResult,
  OptionalId,
  QueryOptions,
  ReplaceOneOptions,
  UpdateFilter,
  UpdateResult,
  WithId
} from "./interfaces";
import {ChangeStream} from "./changeStream";
import {BulkWriteOperationFactory} from "./operations/bulk";

/**
 * A collection of documents.
 */
export class Collection<T extends Document = any> {
  private changeStreams: ChangeStream[] = [];

  public constructor(
    public readonly name: string,
    private writeOpFactory: BulkWriteOperationFactory<T>,
    private driver: CollectionDriver<T>,
    public aggregate: <U>(pipeline: Document[]) => Promise<U[]>
  ) {}

  /**
   * Find documents in the collection.
   *
   * @param filter The filter which documents are matched against.
   * @returns A cursor.
   */
  public find(filter: Filter<T> = {}, options: QueryOptions<T> = {}): Cursor<T> {
    return this.driver.find(filter, options);
  }

  /**
   * Find a single document in the collection.
   *
   * @param selector The selector which documents are matched against.
   * @returns A promise for the first matching document if one was found, null otherwise
   */
  public findOne(filter: Filter<T>): Promise<T | null> {
    return this.driver.findOne(filter);
  }

  /**
   * Insert a document into the collection.
   *
   * If the document passed in do not contain the _id field, one will be added to it
   *
   * @param document The document to insert.
   * @throws Error if a document with the same ID already exists
   */
  public async insertOne(document: OptionalId<T>): Promise<InsertOneResult> {
    const {insertedIds} = await this.bulkWrite([{insertOne: {document}}]);
    return {acknowledged: true, insertedId: insertedIds[0]};
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
  public async insertMany(documents: OptionalId<T>[]): Promise<InsertManyResult> {
    const {insertedCount, insertedIds} = await this.bulkWrite(
      documents.map(document => ({insertOne: {document}}))
    );
    return {acknowledged: true, insertedCount, insertedIds}
  }

  /**
   * Delete a document from a collection
   *
   * @param filter The Filter used to select the document to remove
   */
  public async deleteOne(filter: Filter<T>): Promise<DeleteResult> {
    const {deletedCount} = await this.bulkWrite([{deleteOne: {filter}}]);
    return {acknowledged: true, deletedCount}
  }

  /**
   * Delete multiple documents from a collection
   *
   * @param filter The Filter used to select the documents to remove
   */
  public async deleteMany(filter: Filter<T>): Promise<DeleteResult> {
    const {deletedCount} = await this.bulkWrite([{deleteMany: {filter}}]);
    return {acknowledged: true, deletedCount}
  }

  /**
   * Replace a document in a collection with another document
   *
   * @param filter - The filter used to select the document to replace
   * @param replacement - The Document that replaces the matching document
   * @param options - Optional settings for the command
   */
  public async replaceOne(
    filter: Filter<T>, replacement: T, options?: ReplaceOneOptions
  ): Promise<UpdateResult> {
    return this.updateResult(await this.bulkWrite([
      {replaceOne: {filter, replacement, upsert: options?.upsert}}
    ]));
  }

  /**
   * Update a single document in a collection
   *
   * @param filter - The filter used to select the document to update
   * @param update - The update operations to be applied to the document
   */
  public async updateOne(filter: Filter<T>, update: UpdateFilter<T>): Promise<UpdateResult> {
    return this.updateResult(await this.bulkWrite([
      {updateOne: {filter, update}}
    ]));
  }

  /**
   * Update multiple documents in a collection
   *
   * @param filter - The filter used to select the documents to update
   * @param update - The update operations to be applied to the documents
   */
  public async updateMany(filter: Filter<T>, update: UpdateFilter<T>): Promise<UpdateResult> {
    return this.updateResult(await this.bulkWrite([
      {updateMany: {filter, update}}
    ]));
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
  public async bulkWrite(operations: AnyBulkWriteOperation<T>[]): Promise<BulkWriteResult> {
    return this.writeOpFactory.createOperation(operations, this.changeStreams).execute();
  }

  /**
   * The distinct command returns a list of distinct values for the given key across a collection.
   *
   * @param key - Field of the document to find distinct values for
   * @param filter - The filter for filtering the set of documents to which we apply the distinct filter.
   */
  public async distinct<Key extends keyof WithId<T>>(
    key: Key | string,
    filter: Filter<T> = {}
  ): Promise<Array<Flatten<WithId<T>[Key]>>> {
    return this.aggregate<WithId<any>>([
      {$match: filter},
      {$group: {_id: `$${key}`}}
    ]).then(docs => docs.map(doc => doc._id));
  }

  /**
   * Create a new Change Stream, watching for new changes (insertions, updates, replacements, deletions, and invalidations) in this collection.
   *
   * @param pipeline - An array of {@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/|aggregation pipeline stages} through which to pass change stream documents. This allows for filtering (using $match) and manipulating the change stream documents.
   * @param options - Optional settings for the command
   */
  public watch<TLocal = T>(pipeline: Document[] = []): ChangeStream<TLocal> {
    const cs = new ChangeStream<TLocal>(pipeline, cs => {
      this.changeStreams.splice(this.changeStreams.indexOf(cs), 1);
    });
    this.changeStreams.push(cs);
    return cs;
  }

  private updateResult({matchedCount, modifiedCount, upsertedCount, upsertedIds}: BulkWriteResult): UpdateResult {
    return {acknowledged: true, matchedCount, modifiedCount, upsertedCount, upsertedId: upsertedIds[0]};
  }
}