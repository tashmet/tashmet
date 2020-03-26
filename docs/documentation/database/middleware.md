---
description: Collection middleware
---

# Middleware

## Built-in middleware

Ziqquratu comes with built in middleware for the most common use cases like caching, logging and validation. We will explore each of these and how they can be used together below.

### Logging

Logging is useful, especially server-side, to see what operations are performed on a collection and if there are any errors. 

#### Usage

Simply import the logging middleware from the main package and apply it to your collection. If you have other middleware for the same collection you probably want to put logging at the top of the stack \(first in the list\) to catch the result of operations occurring below.

```typescript
import {logging} from '@ziqquratu/ziqquratu';
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
npm install @ziqquratu/caching
```

#### Usage

```typescript
import {caching} from '@ziqquratu/caching';
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
npm install @ziqquratu/schema
```

#### Usage

Schemas need to be added to their own collection. They are then referenced by the schema $id in the validation middleware. By default the validator expects to find schemas in a collection named **schemas**

```typescript
import {validation} from '@ziqquratu/caching';

// Example database config
const databaseConfig: DatabaseConfig = {
  collections: {
    'schemas': memory({documents: schemas}),
    'products': {
      source: memory(),
      use: [
        validation({
          schema: 'http://example.com/product.schema.json'
        })
      ]
    }
  }
}
```

