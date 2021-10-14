---
description: A collection synced to a RESTful endpoint
---

# Http

## Description

This collection works against a RESTful endpoint to retrieve and store documents. If the endpoint supports emitting events over socket.io it will also receive updates to documents on the server.

## Usage

A collection can be created using its factory function.

```typescript
database.createCollection('posts', http({
  path: '/api/posts'
}));
```

The function requires a configuration where a path to the endpoint needs to be specified.

### Query parameters

By default the queries will be sent with two query parameters, named selector and options, each serialized to a JSON string. This works fine if you're working against a [Server resource](https://ziggurat.gitbook.io/server/documentation/controllers/resource), but if you're using an API with another convention you will need to do your own serialization here.

```typescript
http({
  path: 'api/posts',
  queryParams: (selector, options) => {
    // Return a custom key-value map here
  }
});
```

