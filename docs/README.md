---
description: An introduction to the Tashmit publishing platform
---

# Introduction

## Description

Tashmit is a lightweight open-source database written in typescript with the purpose of publishing content in a web application such as a blog or a larger web site. The framework is isomorphic, meaning it can run both on the server and the client.

Setting up an application is easy, so let's get started!

{% page-ref page="getting-started/application.md" %}

## Philosophy

The framework was created mainly to make it easy to share content between a server and a client. It was built using a highly modular design with scalability in mind which means you could use it for a simple web-page, blog or larger web application.

When running it in a web-browser you probably want to have the content rendered using some front-end framework. Tashmit does not limit your choices here.

## Packages

The project is split over a number of different packages, with most being dependent on at least the core package and the database. There is also a convenience package called simply tashmit that exports everything from those two packages.

```typescript
import {component} from '@tashmit/tashmit';

@component()
class Application {}
```

The only difference with importing from this package is the component, exported from the core package. When imported like above it will include a dependency on the database. Thus the above is equivalent to the following.

```typescript
import {component} from '@tashmit/core';

@component({
  dependencies: [
    import('@tashmit/database')
  ]
})
class Application {}
```

### Core packages

These are the packages included in the main package

#### [Core](tashmit/core/)

Underlying library dealing with inversion of control \(dependency injection\) and reflection \(meta data and decorators\).

#### [Database](tashmit/database/)

The database including collections for storing in [memory](tashmit/database/collections/memory.md) and via [HTTP](tashmit/database/collections/http.md).

### Middleware packages

Packages containing functionality that can be plugged in to and enhance collections in the database. These are all covered in the section on [middleware](tashmit/database/middleware.md).

#### [Caching](tashmit/database/middleware.md#caching)

Caching middleware for collections.

#### Pipe

Middleware for creating pipes that can process documents in collections.

#### [Schema](tashmit/database/middleware.md#validation)

JSON schema validation middleware for collections.

### Utility packages

#### [View](tashmit/views/) <a id="view"></a>

Stored queries and views monitoring subsets of documents in a collection.

### Server packages

These are packages that provide additional server-side functionality.

#### [Nabu](tashmit/nabu/)

A set of tools for reading and writing content on disk. It allows us to store collections in files with support for common formats like JSON, YAML and Markdown.

#### [Server](tashmit/server.md)

An HTTP server for publishing content. It allows us to define RESTful resources that interact with the collections in our database.



