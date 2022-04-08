---
description: Database package
---

# Basic usage

## Collection

### Operations

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

#### findOne

Find the first document matching the filter.

#### find

Find all documents matching the filter and return a cursor.

#### deleteOne

#### deleteMany

#### updateOne

#### updateMany

#### replaceOne

### Aggregation

