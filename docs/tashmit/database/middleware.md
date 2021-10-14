---
description: Collection middleware
---

# Middleware

## Built-in middleware

Tashmit comes with built in middleware for the most common use cases like caching, logging and validation. We will explore each of these and how they can be used together below.

### Logging

Logging is useful, especially server-side, to see what operations are performed on a collection and if there are any errors.

#### Usage

Simply import the logging middleware from the main package and apply it to your collection. If you have other middleware for the same collection you probably want to put logging at the top of the stack \(first in the list\) to catch the result of operations occurring below.

```typescript
import {logging} from '@tashmit/tashmit';
...
const collection = database.createCollection('test', {
  source: memory(),
  use: [logging()]
});
```

### Caching

Caching allows us to store documents from a collection in memory so that they don't have to be fetched from the source every time. In the client this has obvious benefits when working with an http collection. In the server it can also be useful especially when combined with validation. See the validation docs below for more information on that.

#### Installation

```text
npm install @tashmit/caching
```

#### Usage

```typescript
import {caching} from '@tashmit/caching';
...
const collection = database.createCollection('test', {
  source: http({path: '/api/test'}),
  use: [caching()]
});
```

### Validation

Schema validation of documents in collections is provided through the schema package.

#### Installation

```text
npm install @tashmit/schema
```

#### Usage

Schemas need to be added to their own collection. They are then referenced by the schema $id in the validation middleware. By default the validator expects to find schemas in a collection named **schemas**

```typescript
import {validation, ValidationPipeStrategy} from '@tashmit/caching';

// Example database config
const databaseConfig: DatabaseConfig = {
  collections: {
    'schemas': memory({documents: schemas}),
    'products': {
      use: [
        validation({
          schema: 'http://example.com/product.schema.json',
          strategy: ValidationPipeStrategy.ErrorIn
        })
      ],
      source: memory(),
    }
  }
}
```

#### Strategies

The behavior of the validation pipe can be configured by utilizing one of several strategies. The default one is called **ErrorIn** which is explicitly stated above. Here are the available strategies:

```typescript
export enum ValidationPipeStrategy {
  /**
   * Reject both incoming and outgoing documents with errors.
   */
  Error,

  /**
   * Reject incoming documents with error
   */
  ErrorIn,

  /**
   * Reject incoming documents with error, filter out outgoing documents.
   */
  ErrorInFilterOut,

  /**
   * Filter out both incoming and outgoing documents with errors.
   */
  Filter,

  /**
   * Filter out only incoming documents with errors.
   */
  FilterIn,
};
```

To clarify the concepts, incoming documents refer to the documents provided to the operations **insertOne**, **insertMany** and **replaceOne** while outgoing documents refer to the result of the operations **find** and **findOne**.

## Chaining

As seen in the previous examples the middleware is given as a list. To visualize how multiple middleware are chained together it is useful to put each item in the list on it's own row and the source on a line below. The operations on the collection are performed through the list from top to bottom until finally acting on the source. Events emitted from the source naturally travel the other way, from the bottom to the top of the stack. With this in mind we will look at an example that chains all the middleware described above together.

```typescript
{
  use: [
    logging(),
    caching(),
    validation({
      schema: 'http://example.com/product.schema.json'
      strategy: ValidationPipeStrategy.ErrorInFilterOut
    }),
  ],
  source: directory({
    path: 'products',
    extension: 'yaml',
    serializer: yaml(),
  })
}
```

Here we have a collection of products that are stored in YAML files on disk. A user should be able to add and edit products either through some interface that performs operations on the collection inside the application or by editing the files in a text editor. This poses a challenge since we need to validate documents entering the collection either from above or below.

Since we can't guarantee that the source documents are always valid due to users manually entering data on disk, we employ a cache to contain a subset of valid documents. The validation is configured to use a strategy called **ErrorInFilterOut** which means that trying to insert invalid documents should result in an error \(rejection of promise\) while querying documents should return only ones that are valid.

When a user inserts a document the caching middleware will forward the request to the validation stage. If successful, the document will be stored on disk and returned back though the chain up to the cache where it is also added. Inserting and invalid document will interrupt the chain at the validation stage and cause the cache not to add it. Notice that since logging is at the top of the stack it will log whatever result is returned from below.

If the user adds an invalid product by creating a new file on disk a **document-upserted** event will be sent, first to the validation stage, which will fail and cause a **document-error** event to trickle up instead. The cache will ignore it and the logging middleware will log an error. When the application queries for documents in the collection the cache will forward the query to the validation  which will return the subset of valid documents from the source that matches the query. Making the same query again will cause the cache to return the same documents directly thus improving performance.

