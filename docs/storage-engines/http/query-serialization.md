---
description: Turn database queries into HTTP query strings
---

# Query Serialization

## Introduction

In order to fetch data from an external API we need to be able to turn our database queries into HTTP query strings. Tashmet comes with a powerful query builder that allows you to customize your queries to fit just about any API. First we will have a look at some of the built-in formats that should suit most needs.

### Query components

A database query consists of a few components that we can pass on in the query string. These are as follows:

* filter
* sort
* skip
* limit
* projection

The most complex of course is the filter which can potentially have a lot of operators and nesting levels. Turning a complex filter into a query string is therefore quite challenging, and if we are using a legacy API there will not be support for most operators anyway. Basically we will be limited to using filter operators in the client that are also available in the server in some form. If we have a server that supports MongoDB-like queries, then we have a couple of built-in options for lossless serialization, [JSON](query-serialization.md#json) and nested

### Configuration

The query serializer is configured on the HttpClient plugin as follows.&#x20;

```typescript
Tashmet
  .configure()
  .use(HttpClient, {
    querySerializer: QuerySerializer.flat(),
  })
  ...
```

## Built-in formats

### JSON

The most basic form of serialization is to basically just turn our queries into JSON and send that to the server.&#x20;

```typescript
QuerySerializer.json()
```

### Flat



```typescript
col.find({ runtime: { $lt: 15 } }).sort({title: 1}).toArray()

// Output: http://localhost/movies?runtime:lt=15&sort=title

```
