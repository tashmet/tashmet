import {EventEmitter} from 'eventemitter3';
import ObjectId from 'bson-objectid';
import {Factory} from '@tashmit/core';
import {OperatorConfig} from '@tashmit/operators';

export type Document = Record<string, any>;

export enum SortingDirection {
  Ascending = 1,
  Descending = -1
}

export type SortingMap = {[key: string]: SortingDirection};
export type SortingKey = string | string[] | SortingMap;

export type Filter<TSchema> = {
  [P in keyof TSchema]?: Condition<TSchema[P]>;
} &
  RootFilterOperators<TSchema>;

export type Condition<T> = AlternativeType<T> | FilterOperators<AlternativeType<T>>;

/**
 * It is possible to search using alternative types in mongodb e.g.
 * string types can be searched using a regex in mongo
 * array types can be searched using their element type
 * @public
 */
export type AlternativeType<T> = T extends ReadonlyArray<infer U>
  ? T | RegExpOrString<U>
  : RegExpOrString<T>;

/** @public */
export type RegExpOrString<T> = T extends string ? RegExp | T : T;

/** @public */
export interface RootFilterOperators<TSchema> extends Document {
  $and?: Filter<TSchema>[];
  $nor?: Filter<TSchema>[];
  $or?: Filter<TSchema>[];
  $text?: {
    $search: string;
    $language?: string;
    $caseSensitive?: boolean;
    $diacriticSensitive?: boolean;
  };
  $where?: string | ((this: TSchema) => boolean);
  $comment?: string | Document;
}

/** @public */
export interface FilterOperators<TValue> extends Document {
  // Comparison
  $eq?: TValue;
  $gt?: TValue;
  $gte?: TValue;
  $in?: TValue[];
  $lt?: TValue;
  $lte?: TValue;
  $ne?: TValue;
  $nin?: TValue[];
  // Logical
  $not?: TValue extends string ? FilterOperators<TValue> | RegExp : FilterOperators<TValue>;
  // Element
  /**
   * When `true`, `$exists` matches the documents that contain the field,
   * including documents where the field value is null.
   */
  $exists?: boolean;
  $type?: BSONType | BSONTypeAlias;
  // Evaluation
  $expr?: Record<string, any>;
  $jsonSchema?: Record<string, any>;
  $mod?: TValue extends number ? [number, number] : never;
  $regex?: TValue extends string ? RegExp | string : never;
  $options?: TValue extends string ? string : never;
  // Geospatial
  $geoIntersects?: { $geometry: Document };
  $geoWithin?: Document;
  $near?: Document;
  $nearSphere?: Document;
  $maxDistance?: number;
  // Array
  $all?: TValue extends ReadonlyArray<any> ? any[] : never;
  $elemMatch?: TValue extends ReadonlyArray<any> ? Document : never;
  $size?: TValue extends ReadonlyArray<any> ? number : never;
  // Bitwise
  $bitsAllClear?: BitwiseFilter;
  $bitsAllSet?: BitwiseFilter;
  $bitsAnyClear?: BitwiseFilter;
  $bitsAnySet?: BitwiseFilter;
  $rand?: Record<string, never>;
}

/** @public */
export const BSONType = Object.freeze({
  double: 1,
  string: 2,
  object: 3,
  array: 4,
  binData: 5,
  undefined: 6,
  objectId: 7,
  bool: 8,
  date: 9,
  null: 10,
  regex: 11,
  dbPointer: 12,
  javascript: 13,
  symbol: 14,
  javascriptWithScope: 15,
  int: 16,
  timestamp: 17,
  long: 18,
  decimal: 19,
  minKey: -1,
  maxKey: 127
} as const);

/** @public */
export type BSONType = typeof BSONType[keyof typeof BSONType];
/** @public */
export type BSONTypeAlias = keyof typeof BSONType;

/** @public */
export type BitwiseFilter =
  | number /** numeric bit mask */
  // | Binary /** BinData bit mask */
  | number[]; /** `[ <position1>, <position2>, ... ]` */

export type Projection<T> = {
  [Key in keyof T]?: 0 | 1 | boolean;
} &
  Partial<Record<string, 0 | 1 | boolean>>;

export type AggregationPipeline = Record<string, any>[];

export interface Cursor<T> {
  /**
   * Sets the sort order of the cursor query.
   *
   * If the key is either a string or list of strings the direction will be given by the second
   * argument or default to ascending order.
   *
   * If the key is given as a key-value map the sorting direction for each of the keys will be
   * determined by its value and the direction argument can be omitted.
   */
  sort(key: SortingKey, direction?: SortingDirection): Cursor<T>;

  /** Set the skip for the cursor. */
  skip(count: number): Cursor<T>;

  /** Set the limit for the cursor. */
  limit(count: number): Cursor<T>;

  /** Returns an array of documents. */
  toArray(): Promise<T[]>;

  /**
   * Get the next available document from the cursor, returns null if no more documents are available
   */
  next(): Promise<T | null>;

  /** Check if there is any document still available in the cursor */
  hasNext(): Promise<boolean>;

  /** Iterates over all the documents for this cursor using the iterator, callback pattern */
  forEach(iterator: (doc: T) => void): Promise<void>;

  /**
   * Get the count of documents for this cursor
   *
   * @param applySkipLimit Should the count command apply limit and skip settings on the cursor.
   */
  count(applySkipLimit?: boolean): Promise<number>;
}

/**
 *
 */
export interface QueryOptions<T = any> {
  /**
   * Set to sort the documents coming back from the query. Key-value map, ex. {a: 1, b: -1}
   */
  sort?: SortingMap;

  /**
   * Skip the first number of documents from the results.
   */
  skip?: number;

  /**
   * Limit the number of items that are fetched.
   */
  limit?: number;

  /**
   * The fields to return in the query.
   *
   * Object of fields to either include or exclude (one of, not both),
   * {'a':1, 'b': 1} or {'a': 0, 'b': 0}
   */
  projection?: Projection<T>
}

export interface Query<T = any> extends QueryOptions<T> {
  filter?: Filter<T>;
}

export interface ReplaceOneOptions {
  /** When true, creates a new document if no document matches the query. */
  upsert?: boolean;
}

export interface DatabaseEventEmitter {
  on(event: 'change', fn: (change: DatabaseChange) => void): this;

  on(event: 'error', fn: (error: DatabaseError) => void): this;
}

/**
 * A collection of documents.
 */
export declare interface Collection<T = any> {
  /**
   * Name of the collection.
   */
  readonly name: string;

  /* Execute an aggregation framework pipeline against the collection */
  aggregate<U>(pipeline: AggregationPipeline): Promise<U[]>

  /**
   * Insert a document into the collection.
   *
   * If the document passed in do not contain the _id field, one will be added to it
   *
   * @param doc The document to insert.
   * @returns A promise for the inserted document.
   * @throws Error if a document with the same ID already exists
   */
  insertOne(doc: T): Promise<InsertOneResult>;

  /**
   * Insert multiple documents into the collection
   *
   * If documents passed in do not contain the _id field, one will be added to
   * each of the documents missing it
   *
   * @param docs The documents to insert
   * @returns A promise for the inserted documents
   * @throws Error if a document with the same ID already exists
   */
  insertMany(docs: T[]): Promise<InsertManyResult>;

  /**
   * Replace a document in a collection with another document
   *
   * @param filter The Filter used to select the document to replace
   * @param doc The Document that replaces the matching document
   * @param options Optional settings
   * @returns A promise for the new document
   */
  replaceOne(filter: Filter<T>, doc: T, options?: ReplaceOneOptions): Promise<T | null>;

  /**
   * Find documents in the collection.
   *
   * @param filter The filter which documents are matched against.
   * @returns A cursor.
   */
  find(filter?: Filter<T>, options?: QueryOptions<T>): Cursor<T>;

  /**
   * Find a single document in the collection.
   *
   * @param selector The selector which documents are matched against.
   * @returns A promise for the first matching document if one was found, null otherwise
   */
  findOne(filter: Filter<T>): Promise<T | null>;

  /**
   * Delete a document from a collection
   *
   * @param filter The Filter used to select the document to remove
   * @returns The removed document if found, null otherwise
   */
  deleteOne(filter: Filter<T>): Promise<T | null>;

  /**
   * Delete multiple documents from a collection
   *
   * @param filter The Filter used to select the documents to remove
   * @returns A list of all the documents that were removed
   */
  deleteMany(filter: Filter<T>): Promise<T[]>;
}

export abstract class Collection extends EventEmitter implements Collection, DatabaseEventEmitter {}

export class DocumentError extends Error {
  public name = 'DocumentError';

  public constructor(public instance: any, message: string) {
    super(message);
  }
}

export class DatabaseError extends DocumentError {
  public name = 'DatabaseError';

  public constructor(
    public collection: Collection,
    instance: any,
    message: string
  ) { super(instance, message); }
}

export type MiddlewareHook<T> = (next: T) => T;

export type DatabaseChangeEvent<T> = (change: DatabaseChange<T>) => Promise<void>;
export type DatabaseErrorEvent = (error: DatabaseError) => Promise<void>;
export interface EventMiddleware<T = any> {
  change?: MiddlewareHook<DatabaseChangeEvent<T>>;
  error?: MiddlewareHook<DatabaseErrorEvent>;
}

export type Aggregate<T> = (pipeline: AggregationPipeline) => Promise<T[]>;
export type Find<T> = (filter?: Filter<T>, options?: QueryOptions) => Cursor<T>;
export type FindOne<T> = (filter: Filter<T>) => Promise<T | null>;
export type InsertOne<T> = (doc: T) => Promise<InsertOneResult>;
export type InsertMany<T> = (docs: T[]) => Promise<InsertManyResult>;
export type ReplaceOne<T> = (filter: Filter<T>, doc: T, options?: ReplaceOneOptions)
  => Promise<T | null>;
export type DeleteOne<T> = (filter: Filter<T>) => Promise<T | null>;
export type DeleteMany<T> = (filter: Filter<T>) => Promise<T[]>;


export interface MethodMiddleware<T = any> {
  aggregate?: MiddlewareHook<Aggregate<any>>;
  find?: MiddlewareHook<Find<T>>;
  findOne?: MiddlewareHook<FindOne<T>>;
  insertOne?: MiddlewareHook<InsertOne<T>>;
  insertMany?: MiddlewareHook<InsertMany<T>>;
  replaceOne?: MiddlewareHook<ReplaceOne<T>>;
  deleteOne?: MiddlewareHook<DeleteOne<T>>;
  deleteMany?: MiddlewareHook<DeleteMany<T>>;
}

export interface Middleware<T = any> {
  /** Middleware intercepting method calls on collection. */
  methods?: MethodMiddleware<T>;

  /** Middleware intercepting events emitted from collection. */
  events?: EventMiddleware<T>;
}

export interface MiddlewareContext {
  collection: Collection;
  database: Database;
}

export type MiddlewareFactory<T = any> = Factory<Middleware<T>, MiddlewareContext>;


/** Configuration for view collection */

export interface CollectionConfig<T = any> {
  /**
   * Factory creating the collection.
   */
  source: CollectionFactory | T[];

  /**
   * Allows users to specify validation rules or expressions for the collection
   */
  validator?: Document;

  /**
   * Optional list of factories creating middleware that should be applied after any middleware
   * from the database.
   */
  use?: MiddlewareFactory[];

  /**
   * Optional list of factories creating middleware that should be applied before any middleware
   * from the database.
   */
  useBefore?: MiddlewareFactory[];
}

export interface ViewCollectionConfig extends Pick<CollectionConfig, 'use' | 'useBefore'>{
  /** The name of the collection to aggregate from */
  viewOf: string;

  /** The aggregation pipeline */
  pipeline: AggregationPipeline;
}

export type CollectionSource<T> = CollectionFactory<T> | CollectionConfig | ViewCollectionConfig | T[];

/**
 * Configuration for the database.
 */
export interface DatabaseConfig {
  /**
   * Optional list of factories creating middleware that should be applied to all collections in
   * the database.
   */
  use?: MiddlewareFactory[];

  /**
   *
   */
  operators: OperatorConfig;

  collections: Record<string, CollectionSource<any>>;
}

export abstract class DatabaseConfig implements DatabaseConfig {}

export type CollectionChangeAction = 'insert' | 'delete' | 'replace';

export interface DatabaseChange<T = any> {
  data: T[];
  collection: Collection<T>;
  action: CollectionChangeAction;
}

export interface Database {
  /**
   * Get an existing collection by name.
   *
   * @param name The name of the collection.
   * @returns The instance of the collection.
   */
  collection<T = any>(name: string): Collection<T>;

  /**
   * Create a collection.
   *
   * This function will create a new instance given a name and factory.
   *
   * @param name The name of the collection.
   * @param factory The factory creating the collection.
   * @returns An instance of the collection.
   */
  createCollection<T = any>(name: string, factory: CollectionFactory<T>): Collection<T>;

  /**
   * Create a collection.
   *
   * This function will create a new instance given a name and configuration.
   *
   * @param name The name of the collection.
   * @param config The configuration.
   * @returns An instance of the collection.
   */
  createCollection<T = any>(name: string, config: CollectionConfig): Collection<T>;

  createCollection<T = any>(name: string, config: ViewCollectionConfig): Collection<T>;

  createCollection<T = any>(name: string, documents: T[]): Collection<T>;

  createCollection<T = any>(name: string, source: CollectionSource<T>): Collection<T>;
}

/**
 *
 */
export abstract class Database extends EventEmitter implements Database, DatabaseEventEmitter {}

export interface CollectionContext {
  name: string;
  database: Database;
}

export type CollectionFactory<T = any> = Factory<Collection<T>, CollectionContext>;

export abstract class Aggregator<T = any> {
  abstract get pipeline(): AggregationPipeline;

  public execute(collection: Collection): Promise<T[]> {
    return collection.aggregate<T>(this.pipeline);
  }
}

export type Validator<T> = (doc: T) => Promise<T>;

export abstract class ValidatorFactory {
  public abstract create<T>(rules: Document): Validator<T>;
}

/** Given an object shaped type, return the type of the _id field or default to ObjectId @public */
export type InferIdType<TSchema> = TSchema extends { _id: infer IdType } // user has defined a type for _id
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {} extends IdType // TODO(NODE-3285): Improve type readability
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      Exclude<IdType, {}>
    : unknown extends IdType
    ? ObjectId
    : IdType
  : ObjectId; // user has not defined _id on schema

export interface InsertOneResult<TSchema = Document> {
  /** Indicates whether this write result was acknowledged. If not, then all other members of this result will be undefined */
  acknowledged: boolean;
  /** The identifier that was inserted. If the server generated the identifier, this value will be null as the driver does not have access to that data */
  insertedId: InferIdType<TSchema>;
}

export interface InsertManyResult<TSchema = Document> {
  /** Indicates whether this write result was acknowledged. If not, then all other members of this result will be undefined */
  acknowledged: boolean;
  /** The number of inserted documents for this operations */
  insertedCount: number;
  /** Map of the index of the inserted document to the id of the inserted document */
  insertedIds: { [key: number]: InferIdType<TSchema> };
}
