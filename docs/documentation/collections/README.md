# Collections

## Creating collections

Collections can be created either by adding them to the database configuration when bootstrapping or at any later point by calling createCollection on the database.

## Inserting / Updating

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

## Removing

Documents are removed from the collection by using the **remove** method. It takes a selector as its only argument. Every document in the collection matching the selector will be removed and returned as a promise.

```typescript
let docs = await collection.remove({a: 1});
```

{% hint style="info" %}
For every document removed a **document-removed** event will be emitted from the collection.
{% endhint %}

