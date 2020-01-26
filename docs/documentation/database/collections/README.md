# Collections

## Creation

Collections can be created either by adding them to the database configuration when bootstrapping or at any later point by calling **createCollection** on the database.

## Operation

### Inserting / Updating

A document can be inserted or updated in a collection by calling the **upsert** method. It takes the document as its only argument and returns a promise of the upserted document.

```typescript
let doc = await collection.upsert({a: 1});
```

{% hint style="info" %}
Provided that the operation was successful, the resulting promise should resolve with a document that has the **\_id** property set to a unique ID.
{% endhint %}

{% hint style="info" %}
When a document is successfully upserted a **document-upserted** event will be emitted from the collection.
{% endhint %}

### Removing

Documents are removed from the collection by using the **remove** method. It takes a selector as its only argument. Every document in the collection matching the selector will be removed and returned as a promise.

```typescript
let docs = await collection.remove({a: 1});
```

{% hint style="info" %}
For every document removed a **document-removed** event will be emitted from the collection.
{% endhint %}

### Finding

Documents are queried from the collection either by using the **findOne** method for retrieving a single document or by using **find** to retrieve a list of them.

#### findOne

This method takes a selector as its only argument and returns a promise with the first matching document if one was found. If none were matching the selector the promise is rejected with an error.

```typescript
let doc = await collection.findOne({a: 1});
```

#### find

This method takes two optional arguments, a selector as well as query options. If no selector is given every document in the collection will be returned.

```typescript
let docs = await collection.find({a: 1}, {limit: 3});
```

The query options are used for sorting and limiting the result set.

```typescript
export interface QueryOptions {
  sort?: {[key: string]: SortingOrder};

  offset?: number;

  limit?: number;
}
```

### Counting

Documents matching a given selector can be counted using the **count** method. It takes as its only argument an optional selector and returns a promise with the number of documents matching the selector, or the total amount of documents in the collection if the selector was omitted.

```typescript
let docCount = await collection.count({a: 1});
```

