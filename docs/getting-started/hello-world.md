---
description: Learn how to set up a database connection
---

# Hello World

In this section we are going to install Tashmet and create a simple hello world application.

{% hint style="success" %}
**Here's what you are going to learn:**

* How to set up a project
* Connecting to an in-memory database
* Inserting and retrieving a document
{% endhint %}

## Installation

To get started you will need a recent version of node installed. Once that is in place you can go ahead and install the dependencies. For this example, aside from the main package, we are also going to use the mingo plugin which will provide us with an in-memory storage engine.

```
$ npm install @tashmet/tashmet @tashmet/mingo
```



## Your first application

In the following example we are using a default configuration and providing the mingo plugin which will give us access to a storage engine in memory. Once connected we are given a client instance that we can use to create a database.&#x20;

Next we create a collection, insert a single document into it and then run a query for all documents on that same collection. Just like in MongoDB, the find method will return a cursor that we can use to extract the results. Here we pick the first entry and print it to the command line.

```typescript
import Tashmet from '@tashmet/tashmet';
import Mingo from '@tashmet/mingo';

Tashmet
  .configure()
  .use(Mingo, {})
  .connect()
  .then(async tashmet => {
    const db = tashmet.db('hello-world');
    const posts = db.collection('posts');
    await posts.insertOne({title: 'Hello World!'});
    const doc = await posts.find().next();
    
    console.log(doc);
  });

```

### Running the app

To test it out you can install ts-node which allows direct execution of typescript on Node.js.

```shell
npm install ts-node -g
```

The output should be something like this

```shell
{ title: 'Hello World!', _id: '624de5a6a92e999d3a4b5dbf' }
```

Notice that the storage engine has generated an ID for our document since we did not supply one ourselves.
