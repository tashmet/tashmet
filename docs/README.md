---
description: An introduction to the Tashmet database
---

# Introduction

## Description

Tashmet is a lightweight open-source database written in typescript that implements a large subset of MongoDB with almost identical interfaces. In its purest form Tashmet is basically a shell that combined with plugins can access data in various locations, over different protocols, just like if it was stored in a MongoDB instance.&#x20;

{% hint style="success" %}
**Here are some of the main features**

* Can run both in Node.js and in a web browser
* Can store documents in [memory](storage-engines/mingo.md)
* Can write and read documents to files on the [file system](storage-engines/nabu/)
* Can serve as an interface to a [REST API](./#http) while at the same time providing a layer of client-side caching
{% endhint %}

Setting up an application is easy, so let's get started!

{% content-ref url="getting-started/hello-world.md" %}
[hello-world.md](getting-started/hello-world.md)
{% endcontent-ref %}

### Architecture

Tashmet is built to be modular and allows you to only import what you need and thus enables you to keep a very small footprint when used in a browser. The main package consists mostly of MongoDB interfaces and a minimal [dependency injection](concepts/ioc/) framework to allow for easy integration with various plugins such as [storage engines](./#storage-engines).&#x20;

### Usage

Once the database client has been configured, as in the [hello world](getting-started/hello-world.md) example, we can create collections, add documents, run queries or aggregations. As Tashmet tries to mimic MongoDB as closely as possible you can usually refer to the [MongoDB Node.js usage examples](https://www.mongodb.com/docs/drivers/node/current/usage-examples/) for more details on how to interact with the database. This documentation also covers some basic usage examples.

{% content-ref url="concepts/basic-usage.md" %}
[basic-usage.md](concepts/basic-usage.md)
{% endcontent-ref %}

### Storage engines

#### Memory

The memory storage engine is built on top of [mingo](https://github.com/kofrasa/mingo) which has support for most of the query and aggregation operators in MongoDB.

{% content-ref url="storage-engines/mingo.md" %}
[mingo.md](storage-engines/mingo.md)
{% endcontent-ref %}

#### HTTP

A storage engine can also be set up to act on an HTTP endpoint. This provides a level of abstraction that, in combination with the memory storage, can also add a layer of caching.

{% content-ref url="storage-engines/http/" %}
[http](storage-engines/http/)
{% endcontent-ref %}

#### File system

A storage engine that reads from and writes to the file system. Collections can be stored in a single file or spread out by document. Built in file formats includes JSON and YAML. Nabu also uses an in-memory storage engine (Mingo) as a buffer, giving it the same capabilities as using plain Mingo.

{% content-ref url="storage-engines/nabu/" %}
[nabu](storage-engines/nabu/)
{% endcontent-ref %}

