---
title: Collections
description: Operations on collections
---

# Overview

# Collection operations

Tashmet collections support a subset of operations from MongoDB.

## insertOne
```typescript
insertOne(
  document: OptionalId<TSchema>, options?: InsertOneOptions
): Promise<InsertOneResult>
```

Inserts a single document into the collection. If documents passed in do not contain the *_id* field,
one will be added to each of the documents missing it by the driver, mutating the document. This behavior
can be overridden by setting the *forceServerObjectId* flag.

* **doc** - The document to insert
* **options** - Optional settings for the command

See: [https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertOne/](https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertOne/)

---

## insertMany

```typescript
insertMany(
  documents: OptionalId<TSchema>[], options?: BulkWriteOptions
): Promise<InsertManyResult>
```

Inserts an array of documents into the collection. If documents passed in do not contain the *_id* field,
one will be added to each of the documents missing it by the driver, mutating the document. This behavior
can be overridden by setting the *forceServerObjectId* flag.

* **docs** - The documents to insert
* **options** - Optional settings for the command

See: [https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertMany/](https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertMany/)

---

## findOne

```typescript
findOne(): Promise<WithId<TSchema> | null>;
findOne(filter: Filter<TSchema>): Promise<WithId<TSchema> | null>;
findOne(filter: Filter<TSchema>, options: FindOptions): Promise<WithId<TSchema> | null>;
```
Fetches the first document that matches the filter

* **filter** - Query for find Operation
* **options** - Optional settings for the command

See: [https://www.mongodb.com/docs/drivers/node/current/usage-examples/findOne/](https://www.mongodb.com/docs/drivers/node/current/usage-examples/findOne/)

---

## find

```typescript
find(): FindCursor<WithId<TSchema>>;
find(filter: Filter<TSchema>, options?: FindOptions): FindCursor<WithId<TSchema>>;
```

Creates a cursor for a filter that can be used to iterate over results from the collection

* **`filter`** - The filter predicate. If unspecified, then all documents in the collection will match the predicate
* **`options`** - Optional settings for the command
  * **`sort?: SortingMap`** - Set to sort the documents coming back from the query. Key-value map, ex. {a: 1, b: -1}
  * **`skip?: number`** - Skip the first number of documents from the results.
  * **`limit?: number`** - Limit the number of items that are fetched.
  * **`projection?: Projection<TSchema>`** - The fields to return in the query. Object of fields to either include or exclude (one of, not both), {'a':1, 'b': 1} or {'a': 0, 'b': 0}

See: [https://www.mongodb.com/docs/drivers/node/current/usage-examples/find/](https://www.mongodb.com/docs/drivers/node/current/usage-examples/find/)

---

## aggregate

```typescript
aggregate<T extends Document = Document>(
  pipeline: Document[] = [], options: AggregateOptions = {}
): AggregationCursor<T>
```

Execute an aggregation framework pipeline against the collection

* **`pipeline`** - An array of aggregation pipelines to execute
* **`options`** - Optional settings for the command
  * **`batchSize?: number`** - The number of documents to return per batch. See [aggregation documentation](https://docs.mongodb.com/manual/reference/command/aggregate).
  * **`bypassDocumentValidation?: boolean`** - Allow driver to bypass schema validation
  * **`collation?: CollationOptions`** - Specify collation.
  * **`out?: string`**

See: [https://www.mongodb.com/docs/drivers/node/current/usage-examples/aggregate/](https://www.mongodb.com/docs/drivers/node/current/usage-examples/aggregate/)

---

## distinct

```typescript
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
```

The distinct command returns a list of distinct values for the given key across a collection.

---

## countDocuments

```typescript
countDocuments(
  filter: Filter<TSchema> = {}, options: CountDocumentsOptions = {}
): Promise<number>
```

Gets the number of documents matching the filter.

* **`filter`** - The filter for the count
* **`options`** - Optional settings for the command

---

## replaceOne

```typescript
replaceOne(
  filter: Filter<TSchema>, replacement: TSchema, options?: ReplaceOneOptions
): Promise<UpdateResult>
```

Replace a document in a collection with another document

---

## updateOne

## updateMany

## deleteOne

```typescript
deleteOne(filter: Filter<TSchema>, options?: DeleteOptions): Promise<DeleteResult>
```

Delete a document from a collection

* **filter** - The filter used to select the document to remove
* **options** - Optional settings for the command

---

## deleteMany


