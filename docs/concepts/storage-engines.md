# Storage engines

## Introduction

The storage engine is responsible for storing documents. It is bundled with an aggregation engine that allows for queries such as finding, updating, replacing and deleting those documents.

### Nabu

The primary storage engine for Tashmet is called Nabu. It is a persistent storage solution that allows for documents to be written to and read from the file system. Nabu is also bundled with a fallback option for in-memory storage that can be configured per collection.

{% content-ref url="../storage-engines/nabu/" %}
[nabu](../storage-engines/nabu/)
{% endcontent-ref %}

### Memory

The memory storage engine is a purely volatile storage solution.

{% content-ref url="../storage-engines/mingo.md" %}
[mingo.md](../storage-engines/mingo.md)
{% endcontent-ref %}

## Interface

Each storage engine implements a simple interface that gives a server or client (by proxy) access.

```typescript
export interface StorageEngine {
  command(ns: TashmetNamespace, command: Document): Promise<Document>;

  on(event: 'change', listener: (change: Document) => void): this;

  proxy(): TashmetProxy;
}
```

For each supported operation the Tashmet client will build a command that is passed through a proxy, either the proxy provided by the storage engine, or though a network connection to a server that acts on the storage engine.

Hence, once a storage engine is created, we can actually execute these raw commands on the engine directly. Consider the following example:

```typescript
const ns = new TashmetNamespace('mydb');

const storageEngine = Memory
  .configure({})
  .use(mingo())
  .bootstrap()

// Create a collection named 'test'
await storageEngine.command(ns, {create: 'test'});

// Insert a number of documents into it.
await storageEngine.command(ns, {insert: 'test', documents: [
  { _id: 1, category: "cake", type: "chocolate", qty: 10 },
  { _id: 2, category: "cake", type: "ice cream", qty: 25 },
  { _id: 3, category: "pie", type: "boston cream", qty: 20 },
  { _id: 4, category: "pie", type: "blueberry", qty: 15 }
]});
```
