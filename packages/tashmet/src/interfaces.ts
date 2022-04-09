import ObjectId from 'bson-objectid';
import {EventEmitter} from 'eventemitter3';
import {Collection} from './collection';
import {ChangeStreamDocument, ChangeStreamEvents} from './changeStream';
import {ChangeSet} from './changeSet';

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

export interface Cursor<T> {
  [Symbol.asyncIterator](): AsyncIterator<T, void>;

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

export interface CommandOperationOptions {
  /** Specify collation */
  collation?: CollationOptions;
}

export interface AggregateOptions extends CommandOperationOptions {}

/**
 *
 */
export interface FindOptions<TSchema = any> extends CommandOperationOptions {
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
  projection?: Projection<TSchema>;
}

export interface Query<T = any> extends FindOptions<T> {
  filter?: Filter<T>;
}

export interface ReplaceOneOptions {
  /** When true, creates a new document if no document matches the query. */
  upsert?: boolean;
}

export interface CollationOptions {
  readonly locale: string;
  readonly caseLevel?: boolean;
  readonly caseFirst?: string;
  readonly strength?: number;
  readonly numericOrdering?: boolean;
  readonly alternate?: string;
  readonly maxVariable?: string; // unsupported
  readonly backwards?: boolean; // unsupported
}

/** Configuration for view collection */
export interface CreateCollectionOptions {
  /**
   * Allows users to specify validation rules or expressions for the collection
   */
  validator?: Document;

  collation?: CollationOptions;

  /** The name of the collection to aggregate from */
  viewOf?: string;

  /** The aggregation pipeline */
  pipeline?: Document[];

  storageEngine?: Document;
}

export interface Database {
  readonly databaseName: string;

  /**
   * Get an existing collection by name.
   *
   * @param name The name of the collection.
   * @returns The instance of the collection.
   */
  collection<TSchema extends Document = any>(name: string): Collection<TSchema>;

  createCollection<TSchema extends Document = any>(name: string, options?: CreateCollectionOptions): Collection<TSchema>;

  /**
   * Fetch all collections for the current db.
   */
  collections(): Collection[];

  /**
   * Drop a collection from the database, removing it permanently.
   *
   * @param name - Name of collection to drop
   */
  dropCollection(name: string): Promise<boolean>;
}

export interface DatabaseFactory {
  createDatabase(name: string): Database;
}

export abstract class DatabaseFactory implements DatabaseFactory {}

export interface Aggregator {
  execute<T = any>(ns: Namespace, pipeline: Document[], options?: AggregateOptions): Cursor<T>;
}

export abstract class Aggregator implements Aggregator {}

export type Validator<T> = (doc: T) => Promise<T>;

export abstract class ValidatorFactory {
  public abstract create<T>(rules: Document): Validator<T>;
}

export abstract class CachingLayer {
  public abstract create<T>(store: Store<T>): Middleware<T>;
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
  /** The identifier that was inserted. If the server generated the identifier, this value will be null as the engine does not have access to that data */
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

export interface DeleteResult {
  /** Indicates whether this write result was acknowledged. If not, then all other members of this result will be undefined. */
  acknowledged: boolean;
  /** The number of documents that were deleted */
  deletedCount: number;
}

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
  upsertedId?: ObjectId
}

export type EnhancedOmit<TRecordOrUnion, KeyUnion> = string extends keyof TRecordOrUnion
  ? TRecordOrUnion // TRecordOrUnion has indexed type e.g. { _id: string; [k: string]: any; } or it is "any"
  : TRecordOrUnion extends any
  ? Pick<TRecordOrUnion, Exclude<keyof TRecordOrUnion, KeyUnion>> // discriminated unions
  : never;

export type WithId<TSchema> = EnhancedOmit<TSchema, '_id'> & { _id: InferIdType<TSchema> };

export type OptionalId<TSchema extends { _id?: any }> = ObjectId extends TSchema['_id'] // a Schema with ObjectId _id type or "any" or "indexed type" provided
  ? EnhancedOmit<TSchema, '_id'> & { _id?: InferIdType<TSchema> } // a Schema provided but _id type is not ObjectId
  : WithId<TSchema>;

export type IntegerType = number;

export type NumericType = IntegerType;

export type FilterOperations<T> = T extends Record<string, any>
  ? { [key in keyof T]?: FilterOperators<T[key]> }
  : FilterOperators<T>;

export type IsAny<Type, ResultIfAny, ResultIfNotAny> = true extends false & Type
  ? ResultIfAny
  : ResultIfNotAny;

export type Flatten<Type> = Type extends ReadonlyArray<infer Item> ? Item : Type;

export type OnlyFieldsOfType<TSchema, FieldType = any, AssignableType = FieldType> = IsAny<
  TSchema[keyof TSchema],
  Record<string, FieldType>,
  AcceptedFields<TSchema, FieldType, AssignableType> &
    NotAcceptedFields<TSchema, FieldType> &
    Record<string, AssignableType>
>;

export type MatchKeysAndValues<TSchema> = Readonly<Partial<TSchema>> & Record<string, any>;

export type KeysOfAType<TSchema, Type> = {
  [key in keyof TSchema]: NonNullable<TSchema[key]> extends Type ? key : never;
}[keyof TSchema];

export type KeysOfOtherType<TSchema, Type> = {
  [key in keyof TSchema]: NonNullable<TSchema[key]> extends Type ? never : key;
}[keyof TSchema];

export type AcceptedFields<TSchema, FieldType, AssignableType> = {
  readonly [key in KeysOfAType<TSchema, FieldType>]?: AssignableType;
};

/** It avoids using fields with not acceptable types */
export type NotAcceptedFields<TSchema, FieldType> = {
  readonly [key in KeysOfOtherType<TSchema, FieldType>]?: never;
};

export type ArrayOperator<Type> = {
  $each?: Array<Flatten<Type>>;
  $slice?: number;
  $position?: number;
  $sort?: SortingMap;
};

export type SetFields<TSchema extends Document> = ({
  readonly [key in KeysOfAType<TSchema, ReadonlyArray<any> | undefined>]?:
    | OptionalId<Flatten<TSchema[key]>>
    | AddToSetOperators<Array<OptionalId<Flatten<TSchema[key]>>>>;
} &
  NotAcceptedFields<TSchema, ReadonlyArray<any> | undefined>) & {
  readonly [key: string]: AddToSetOperators<any> | any;
};

export type PushOperator<TSchema> = ({
  readonly [key in KeysOfAType<TSchema, ReadonlyArray<any>>]?:
    | Flatten<TSchema[key]>
    | ArrayOperator<Array<Flatten<TSchema[key]>>>;
} &
  NotAcceptedFields<TSchema, ReadonlyArray<any>>) & {
  readonly [key: string]: ArrayOperator<any> | any;
};

export type PullOperator<TSchema> = ({
  readonly [key in KeysOfAType<TSchema, ReadonlyArray<any>>]?:
    | Partial<Flatten<TSchema[key]>>
    | FilterOperations<Flatten<TSchema[key]>>;
} &
  NotAcceptedFields<TSchema, ReadonlyArray<any>>) & {
  readonly [key: string]: FilterOperators<any> | any;
};

export type PullAllOperator<TSchema> = ({
  readonly [key in KeysOfAType<TSchema, ReadonlyArray<any>>]?: TSchema[key];
} &
  NotAcceptedFields<TSchema, ReadonlyArray<any>>) & {
  readonly [key: string]: ReadonlyArray<any>;
};

export type AddToSetOperators<Type> = {
  $each?: Array<Flatten<Type>>;
};

export type UpdateFilter<TSchema> = {
  $currentDate?: OnlyFieldsOfType<
    TSchema,
    Date/* | Timestamp*/,
    true | { $type: 'date' | 'timestamp' }
  >;
  $inc?: OnlyFieldsOfType<TSchema, NumericType | undefined>;
  $min?: MatchKeysAndValues<TSchema>;
  $max?: MatchKeysAndValues<TSchema>;
  $mul?: OnlyFieldsOfType<TSchema, NumericType | undefined>;
  $rename?: Record<string, string>;
  $set?: MatchKeysAndValues<TSchema>;
  $setOnInsert?: MatchKeysAndValues<TSchema>;
  $unset?: OnlyFieldsOfType<TSchema, any, '' | true | 1>;
  $addToSet?: SetFields<TSchema>;
  $pop?: OnlyFieldsOfType<TSchema, ReadonlyArray<any>, 1 | -1>;
  $pull?: PullOperator<TSchema>;
  $push?: PushOperator<TSchema>;
  $pullAll?: PullAllOperator<TSchema>;
  $bit?: OnlyFieldsOfType<
    TSchema,
    NumericType | undefined,
    { and: IntegerType } | { or: IntegerType } | { xor: IntegerType }
  >;
} & Document;


export interface InsertOneModel<TSchema extends Document = Document> {
  /** The document to insert. */
  document: OptionalId<TSchema>;
}

export interface DeleteModel<TSchema extends Document = Document> {
  /** The filter to limit the deleted documents. */
  filter: Filter<TSchema>;
  /** Specifies a collation. */
  collation?: CollationOptions;
  /** The index to use. If specified, then the query system will only consider plans using the hinted index. */
  //hint?: Hint;
}

export interface ReplaceOneModel<TSchema extends Document = Document> {
  /** The filter to limit the replaced document. */
  filter: Filter<TSchema>;
  /** The document with which to replace the matched document. */
  replacement: TSchema;
  /** Specifies a collation. */
  collation?: CollationOptions;
  /** The index to use. If specified, then the query system will only consider plans using the hinted index. */
  //hint?: Hint;
  /** When true, creates a new document if no document matches the query. */
  upsert?: boolean;
}

export interface UpdateModel<TSchema extends Document = Document> {
  /** The filter to limit the updated documents. */
  filter: Filter<TSchema>;
  /** A document or pipeline containing update operators. */
  update: UpdateFilter<TSchema> | UpdateFilter<TSchema>[];
  /** A set of filters specifying to which array elements an update should apply. */
  //arrayFilters?: Document[];
  /** Specifies a collation. */
  collation?: CollationOptions;
  /** The index to use. If specified, then the query system will only consider plans using the hinted index. */
  //hint?: Hint;
  /** When true, creates a new document if no document matches the query. */
  upsert?: boolean;
}

/** @public */
export type AnyBulkWriteOperation<TSchema extends Document = Document> =
  | { insertOne: InsertOneModel<TSchema> }
  | { replaceOne: ReplaceOneModel<TSchema> }
  | { updateOne: UpdateModel<TSchema> }
  | { updateMany: UpdateModel<TSchema> }
  | { deleteOne: DeleteModel<TSchema> }
  | { deleteMany: DeleteModel<TSchema> };


export interface BulkWriteResult {
  insertedCount: number;
  matchedCount: number;
  modifiedCount: number;
  deletedCount: number;
  upsertedCount: number;
  upsertedIds: { [key: number]: any };
  insertedIds: { [key: number]: any };
}

export abstract class Writer<TSchema, TModel> {
  public constructor(protected store: Store<TSchema>) {}

  public abstract execute(
    model: TModel,
    eventCb?: (change: ChangeStreamDocument) => void
  ): Promise<Partial<BulkWriteResult>>;
}

export type Namespace = {db: string, coll: string};

export abstract class Store<TSchema extends Document>
  extends EventEmitter implements ChangeStreamEvents<TSchema>
{
  public readonly documents: TSchema[] = [];

  public constructor(
    public readonly ns: Namespace
  ) { super(); }

  public on(event: 'change', fn: (change: ChangeStreamDocument<TSchema>) => void): this {
    return super.on(event, fn);
  }

  public emitAll(cs: ChangeSet<TSchema>) {
    for (const change of cs.toChanges(this.ns)) {
      this.emit('change', change);
    }
  }

  public abstract write(changeSet: ChangeSet<TSchema>): Promise<void>;

  public abstract find(filter?: Filter<TSchema>, options?: FindOptions<TSchema>): Cursor<TSchema>;
}

export type CollectionResolver = (name: string) => any[];

export interface StoreConfig {
  ns: Namespace;
  collation?: CollationOptions;
  options?: Document;
}

export abstract class StorageEngine {
  private stores: Record<string, Store<any>> = {};

  public abstract createStore<TSchema extends Document>(config: StoreConfig): Store<TSchema>;

  public register(store: Store<any>): Store<any> {
    return this.stores[`${store.ns.db}.${store.ns.coll}`] = store;
  }

  public get<TSchema extends Document = Document>({db, coll}: Namespace): Store<TSchema> {
    const key = `${db}.${coll}`;

    if (key in this.stores) {
      return this.stores[key];
    } else {
      throw new Error(`Store with namespace '${key}' does not exist in the storage engine`);
    }
  }

  public drop({db, coll}: Namespace): boolean {
    const key = `${db}.${coll}`;

    if (key in this.stores) {
      delete this.stores[key];
      return true;
    } else {
      return false;
    }
  }
}

export abstract class MemoryStorageEngine extends StorageEngine {};


export type RequireKeys<T extends object, K extends keyof T> =
  Required<Pick<T, K>> & Omit<T, K>;

export abstract class ViewFactory {
  public abstract createView<TSchema extends Document>(
    config: StoreConfig,
    viewOf: Collection<any>,
    pipeline: Document[],
  ): Store<TSchema>;
}

export abstract class CollectionFactory {
  public abstract createCollection<TSchema extends Document>(
    database: Database,
    options: CreateCollectionOptions
  ): Collection<TSchema>;
}

export abstract class Client<TDatabase> {
  public abstract db(name: string): TDatabase;
}

export type MiddlewareHook<T> = (next: T) => T;

export type Aggregate<T> = (pipeline: Document[]) => Cursor<T>;
export type Find<T> = (filter?: Filter<T>, options?: FindOptions) => Cursor<T>;
export type Write<T> = (changeSet: ChangeSet<T>) => Promise<void>;


export interface Middleware<T = any> {
  aggregate?: MiddlewareHook<Aggregate<any>>;
  find?: MiddlewareHook<Find<T>>;
  write?: MiddlewareHook<Write<T>>;
}

export const HashCode = Symbol('HashCode');

export type HashCode = (value: any) => string | null;

export interface Comparator {
  /**
   * Generate a change-set by comparing two collections
   *
   * @param a Collection before changes
   * @param b Collection after changes
   * @returns A change-set
   */
  difference<TSchema extends Document>(a: TSchema[], b: TSchema[]): ChangeSet<TSchema>;
}

export abstract class Comparator implements Comparator {}
