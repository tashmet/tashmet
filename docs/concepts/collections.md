---
description: Database package
---

# Collections

## Operations

### Queries

#### findOne

Find the first document matching the filter.

#### find

Find all documents matching the filter and return a cursor.

#### distinct

### Mutations

#### insertOne

Insert a single document into the collection

```typescript
await result = col.insertOne({title: ''});
console.log(result);

// Output: {acknowledged: true, _id: '625048982512b2b4f6a6529d'}
```

#### insertMany

Insert multiple documents into the collection

```typescript
const result = await col.insertMany([
  { name: "cake", healthy: false },
  { name: "lettuce", healthy: true },
  { name: "donut", healthy: false }
]);
console.log(result);

// Output:
```

####

#### deleteOne

#### deleteMany

#### updateOne

#### updateMany

#### replaceOne

### Aggregations

Aggregations are supported when using Mingo, HTTP with caching (client-side) and Nabu. See the [MongoDB docs](https://www.mongodb.com/docs/drivers/node/current/fundamentals/aggregation/) for details.

```typescript
const docs = [
  { stars: 3, categories: ["Bakery", "Sandwiches"], name: "Rising Sun Bakery" },
  { stars: 4, categories: ["Bakery", "Cafe", "Bar"], name: "Cafe au Late" },
  { stars: 5, categories: ["Coffee", "Bakery"], name: "Liz's Coffee Bar" },
  { stars: 3, categories: ["Steak", "Seafood"], name: "Oak Steakhouse" },
  { stars: 4, categories: ["Bakery", "Dessert"], name: "Petit Cookie" },
];
const result = await coll.insertMany(docs);

const pipeline = [
  { $match: { categories: "Bakery" } },
  { $group: { _id: "$stars", count: { $sum: 1 } } }
];
const aggCursor = coll.aggregate(pipeline);
for await (const doc of aggCursor) {
    console.log(doc);
}
```

The above example should yield the following output

```typescript
{ _id: 4, count: 2 }
{ _id: 3, count: 1 }
{ _id: 5, count: 1 }
```
