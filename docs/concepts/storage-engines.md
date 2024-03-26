---
title: Storage engines
description: The heart of Tashmet
---

# Introduction

The storage engine is responsible for storing documents. It is bundled with an aggregation engine that allows for queries such as finding, updating, replacing and deleting those documents.

---

# Nabu

The primary storage engine for Tashmet is called Nabu. It is a persistent storage solution that allows for documents to be written to and read from the file system. Nabu is also bundled with a fallback option for in-memory storage that is used by default.

{% hint style="check" %}
Features

* Persistent file storage
* Built in support for JSON, YAML and Markdown
* Available only in server (Node.js)
* Includes fallback in-memory storage option
{% /hint %}

## Configuration

The following example creates a Nabu storage engine with default configuration, using mingo as aggregation engine.

```typescript
import Nabu from '@tashmet/nabu';
import mingo from '@tashmet/mingo';

const store = Nabu
  .configure({})
  .use(mingo())
  .bootstrap();
```

See the [Hello world example](/docs/hello-world) for how to connect to and operate on the store

One important aspect of Nabu is that the state of the databases, ie which collections they have and how they are set up, can be persisted to disk in human readable form. If you don't need to create databases and collections dynamically at runtime it's probably more convenient to just craft a configuration file by hand in yaml.

The following configuration option will tell Nabu to look up a database configuration in a yaml file with the same name as the database.

```typescript
const store = Nabu
  .configure({
    dbFile: db => `${db}.yaml`
  })
  // ...
```

Let's create the configuration file for a database called *mydb* that should have a collection named *posts*. We're using a directory to store our documents. For more details and other options see storage options below.

{% file title="mydb.yaml" %}
```yaml
collections:
  posts:
    storageEngine:
      directory:
        path: ./content/posts
        extension: .md
        format:
          yaml:
            frontMatter: true
            contentKey: articleBody
```
{% /file %}

To connect to our database and use the collection we simply do the following.

```typescript
Tashmet
  .connect(store.proxy())
  .then(async tashmet =>  {
    const db = tashmet.db('mydb');
    const posts = await db.collection('posts');
```


## Storage options

Nabu supports a wide range of different storage options that determine how documents are read from and written to disk.

* [Array in file](/docs/array-in-file)
* [Object in file](/docs/object-in-file)
* [Directory](/docs/directory)
* [Glob](/docs/glob)
* [Memory](/docs/memory)

These can be configured per collection or be specified for the whole database

---

# Memory

The memory storage engine is a purely volatile storage solution.

{% hint style="check" %}
Features

* Volatile In-memory storage
* Available both on server and in browser
{% /hint %}


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
