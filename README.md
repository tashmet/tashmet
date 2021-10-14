# Tashmit

This is the Tashmit mono-repo, containing code, tests and documentation for
the Tashmit publishing framework. To get started head over to the
[user documentation](https://tashmit.gitbook.io/).

## Introduction

Tashmit is a lightweight open-source database abstraction written in
typescript with the purpose of making it easy to access data from various
sources in a uniform way.

## One interface, many sources

The main idea behind the project centers around using a MongoDB-compatible
interface that can plug into just about anything that represents a collection.
Each collection in the database can interface to a any one of the following
currently supported sources.

### MongoDB

Natually the popular database is supported as a backend. The Tashmit
collection interface is basically a subset of the MongoDB collection.

### REST

Why not interface with a RESTful API like it was MongoDB database? Tashmit
in a way makes it possible to leverage the power of MongoDB in a client-side
application.

### In Memory

An in-memory collection allows us to store documents in a volatile way which
is useful for things like caching. To support the MongoDB query language in
this setting, Tashmit internally uses [mingo](https://github.com/kofrasa/mingo).

### Files on a file system

Using streams in combination with an in-memory buffer allows for reading
and writing documents on the file system. There is currently support for
working with locally stored documents using vinyl-streams, as well as
remote documents stored on the IPFS (The InterPlanetary File System).

## Modularity

To make it easy to swap out components and only include what's needed in order
to reduce bundle footprint when used in browser, the project is split into
a bunch of different packages. With a built-in inversion-of-control container
loading (or writing) plugins is very simple.

### Middleware

Each collection can also be enhanced with various middleware for things like
caching, validation and convertion of documents to other formats.
