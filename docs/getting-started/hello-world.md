---
title: Hello World
description: A simple example
---

# Introduction

In this section we are going to create a simple hello world application.

{% hint style="check" %}
**Here's what you are going to learn:**

* Connecting to a database
* Inserting and retrieving a document
{% /hint %}

# Your first application

We start by setting up our storage engine. Nabu will, with its default configuration, create databases in memory for us. We will later explore how we can store documents on the file system.

Next we create a collection, insert a single document into it and then run a query for all documents on that same collection. Just like in MongoDB, the find method will return a cursor that we can use to extract the results. Here we pick the first entry and print it to the command line.

{% file title="index.ts" %}
```typescript
import Tashmet from '@tashmet/tashmet';
import Nabu from '@tashmet/nabu';
import mingo from '@tashmet/mingo';

// Create the storage engine
const store = Nabu
  .configure({})
  .use(mingo())
  .bootstrap();

Tashmet
  .connect(store.proxy())
  .then(async tashmet => {
    const db = tashmet.db('hello-world');
    const posts = db.collection('posts');

    // Insert a single document
    await posts.insertOne({title: 'Hello World!'});

    // Retrieve a cursor and get the first document from it
    const doc = await posts.find().next();
    
    console.log(doc);
  });
```
{% /file %}

## Running the app

To test it out you can install ts-node which allows direct execution of typescript on Node.js.

```shell
$ npm install ts-node -g
```

Lets run the application

```shell
$ ts-node index.ts
```

The output should be something like this

```typescript
{ title: 'Hello World!', _id: '624de5a6a92e999d3a4b5dbf' }
```

Notice that an ID has been generated for our document since we did not supply one ourselves.
