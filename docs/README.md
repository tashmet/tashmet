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


{% endhint %}

Setting up an application is easy, so let's get started!

{% content-ref url="getting-started/hello-world.md" %}
[hello-world.md](getting-started/hello-world.md)
{% endcontent-ref %}

### Architecture

Just like MongoDB, Tashmet is built on a client/server architecture but with the additional option to short-loop that gap with a connection to a storage engine in the same process.

The connection medium between client and server (or storage engine) is referred to as the proxy.

Another important feature is the modular design which allows a storage engine to be tailored to very specific needs where custom operators can easily be added for enhancing the aggregation pipeline.&#x20;

### Usage

Once the database client has been configured, as in the [hello world](getting-started/hello-world.md) example, we can create collections, add documents, run queries or aggregations. As Tashmet tries to mimic MongoDB as closely as possible you can usually refer to the [MongoDB Node.js usage examples](https://www.mongodb.com/docs/drivers/node/current/usage-examples/) for more details on how to interact with the database. This documentation also covers some basic usage examples.

{% content-ref url="concepts/operations.md" %}
[operations.md](concepts/operations.md)
{% endcontent-ref %}

### Storage engines

#### Memory

The memory storage engine is trivial to set up and can be used to store documents in a volatile fashion.

{% content-ref url="storage-engines/mingo.md" %}
[mingo.md](storage-engines/mingo.md)
{% endcontent-ref %}

#### Nabu (File system)

Nabu is a storage engine that reads from and writes to the file system where documents are stored in files. Built in file formats includes JSON and YAML. Nabu also gives you the ability to fall back to memory storage for any collection when that is perferred.

{% content-ref url="storage-engines/nabu/" %}
[nabu](storage-engines/nabu/)
{% endcontent-ref %}

