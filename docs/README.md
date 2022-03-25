---
description: An introduction to the Tashmet publishing platform
---

# Introduction

## Description

Tashmet is a lightweight open-source database written in typescript with the purpose of publishing content in a web application such as a blog or a larger web site. The framework is isomorphic, meaning it can run both on the server and the client.

Setting up an application is easy, so let's get started!

{% page-ref page="getting-started/application.md" %}

## Philosophy

The framework was created mainly to make it easy to share content between a server and a client. It was built using a highly modular design with scalability in mind which means you could use it for a simple web-page, blog or larger web application.

When running it in a web-browser you probably want to have the content rendered using some front-end framework. Tashmet does not limit your choices here.

## Packages

The project is split over a number of different packages, with most being dependent on at least the core package and the database. There is also a convenience package called simply tashmet that exports everything from those two packages.

```typescript
import {component} from '@tashmet/tashmet';

@component()
class Application {}
```

The only difference with importing from this package is the component, exported from the core package. When imported like above it will include a dependency on the database. Thus the above is equivalent to the following.

```typescript
import {component} from '@tashmet/core';

@component({
  dependencies: [
    import('@tashmet/database')
  ]
})
class Application {}
```

### Core packages

These are the packages included in the main package

#### [Core](tashmet/core/)

Underlying library dealing with inversion of control \(dependency injection\) and reflection \(meta data and decorators\).

#### [Database](tashmet/database/)

The database including collections for storing in [memory](tashmet/database/collections/memory.md) and via [HTTP](tashmet/database/collections/http.md).

### Middleware packages

Packages containing functionality that can be plugged in to and enhance collections in the database. These are all covered in the section on [middleware](tashmet/database/middleware.md).

#### [Caching](tashmet/database/middleware.md#caching)

Caching middleware for collections.

#### Pipe

Middleware for creating pipes that can process documents in collections.

#### [Schema](tashmet/database/middleware.md#validation)

JSON schema validation middleware for collections.

### Utility packages

#### [View](tashmet/views/) <a id="view"></a>

Stored queries and views monitoring subsets of documents in a collection.

### Server packages

These are packages that provide additional server-side functionality.

#### [File](tashmet/file/)

A set of tools for reading and writing content on disk. It allows us to store collections in files with support for common formats like JSON, YAML and Markdown.

#### [Server](tashmet/server.md)

An HTTP server for publishing content. It allows us to define RESTful resources that interact with the collections in our database.



