# Collections

## Creation

Collections can be created either by adding them to the database configuration when bootstrapping or at any later point by calling **createCollection** on the database.

## Operation

### Inserting

Documents can be added to the collection by using either the **insertOne** method for adding a single document or by using **insertMany** for adding a list of documents.

#### insertOne

Inserts a single document into the collection. If the document has no \_id field one will be assigned by the collection. In case the document has an \_id field and a document with that id already exists in the collection the resulting promise will be rejected with an error. When successful, the inserted document will be returned.

```typescript
let doc = await collection.insertOne({a: 1});
```

{% hint style="info" %}
When a document is successfully inserted a **document-upserted** event will be emitted from the collection.
{% endhint %}

#### insertMany

Insert a list of documents into the collection. Any document that has no \_id field will be assigned one by the collection. If any document has an \_id that already exists in the collection the resulting promise will be rejected with an error. When successful a list of the inserted documents will be returned.

```typescript
let docs = await collection.insertMany([{a: 1}, {b: 2}]);
```

{% hint style="info" %}
A **document-upserted** event will be emitted from the collection for every document that was successfully inserted.
{% endhint %}

### Replacing

#### replaceOne

Replace a single document given a selector and a replacement. Returns the new document if a match was found, otherwise returns **null**.

```typescript
let doc = await collection.replaceOne({_id: 1}, {a: 2});
```

If we want to insert the document in case no match was found we can specify the **upsert** option. 

```typescript
let doc = await collection.replaceOne({_id: 1}, {a: 2}, {upsert: true});
```

{% hint style="info" %}
When a document is successfully replaced \(or upserted\) a **document-upserted** event will be emitted from the collection
{% endhint %}

### Deleting

Documents are removed from the collection by using either the **deleteOne** method for removing a single document or by using **deleteMany** for removing multiple documents.

#### deleteOne

Delete a single document matching the selector. Returns the deleted document if one was found, otherwise returns **null**.

```typescript
let doc = await collection.deleteOne({a: 1});
```

{% hint style="info" %}
If a document was removed a **document-removed** event will be emitted from the collection.
{% endhint %}

#### deleteMany

Delete all documents matching the selector. Returns a list of deleted documents.

```typescript
let docs = await collection.deleteMany({a: 1});
```

{% hint style="info" %}
For every document removed a **document-removed** event will be emitted from the collection.
{% endhint %}

### Finding

Documents are queried from the collection either by using the **findOne** method for retrieving a single document or by using **find** to retrieve a list of them.

#### findOne

Find a single document given a selector. Returns the first matching document if one was found, otherwise returns **null**.

```typescript
let doc = await collection.findOne({a: 1});
```

#### find

Find a list of documents given a selector. Returns a cursor for retrieving the documents.

```typescript
let docs = await collection.find({a: 1}).limit(3).toArray();
```

