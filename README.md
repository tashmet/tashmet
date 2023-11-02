# Tashmet

This is the Tashmet mono-repo, containing code, tests and documentation for
the Tashmet database. To get started head over to the
[user documentation](https://tashmet.gitbook.io/).

## What is this?

Tashmet is a javascript database that provides an interface that as closely
as possible tracks the interface of MongoDB. Basically Tashmet leverages the
power of the excellent aggregation framework [mingo](https://github.com/kofrasa/mingo)
together with concepts like databases and collections to provide a MongoDB-like
experience in pure javascript.

## Why?

The primary motivation for this framework, and what really makes it powerful,
is the ability to work with documents on your filesystem, be they json, yaml
or other formats. Since custom operators are supported, an aggregation
pipeline can also involve steps for doing things like transforming markdown to
html or writing output to the file system. These features alone makes Tashmet
an excellent backbone in a project such as a static site generator.

## Basic concepts

Just like MongoDB, Tashmet is built on a client/server architecture but with
the additional option to short-loop that gap with a connection to a storage
engine in the same process.

The connection medium between client and server (or storage engine) is referred
to as the proxy.

### Hello World!

To illustate the basics lets first look at a simple example where we use the
memory storage engine to create a purely volatile store in memory.

The storage engine is first configured to use mingo as its aggregation engine.
We then connect to the storage engine directly, using its proxy interface. 
Note that no network connection is made in this example.

```ts
import Tashmet from '@tashmet/tashmet';
import mingo from '@tashmet/mingo';
import Memory from '@tashmet/memory';

const store = Memory
  .configure({})
  .use(mingo())
  .bootstrap();

Tashmet
  .connect(store.proxy())
  .then(async tashmet => {
    const db = tashmet.db('hello-world');
    const posts = await db.createCollection('posts');
    await posts.insertOne({title: 'Hello World!'});
    const doc = await posts.find().next();
    console.log(doc);
  });
```

Our document is added to the 'posts' collection on the 'hello-world' database.
We then ask for the first document on the cursor provided by a find-query
without any filter. The output should look something like this:

```bash
{ title: 'Hello World!', _id: '65428e46b48da8f849ee847d' }
```

### Aggregation

To further illustrate the similarities to MongoDB lets look at an example that
comes straight from the MongoDB docs on [aggregation](https://www.mongodb.com/docs/drivers/node/current/fundamentals/aggregation/).

```ts
import Tashmet from '@tashmet/tashmet';
import mingo from '@tashmet/mingo';
import Memory from '@tashmet/memory';

const store = Memory
  .configure({})
  .use(mingo())
  .bootstrap();

Tashmet
  .connect(store.proxy())
  .then(async tashmet => {
    const db = tashmet.db('aggregation');
    const coll = await db.createCollection('restaurants');

    // Create sample documents
    const docs = [
      { stars: 3, categories: ["Bakery", "Sandwiches"], name: "Rising Sun Bakery" },
      { stars: 4, categories: ["Bakery", "Cafe", "Bar"], name: "Cafe au Late" },
      { stars: 5, categories: ["Coffee", "Bakery"], name: "Liz's Coffee Bar" },
      { stars: 3, categories: ["Steak", "Seafood"], name: "Oak Steakhouse" },
      { stars: 4, categories: ["Bakery", "Dessert"], name: "Petit Cookie" },
    ];

    // Insert documents into the restaurants collection
    await coll.insertMany(docs);

    // Define an aggregation pipeline with a match stage and a group stage
    const pipeline = [
      { $match: { categories: "Bakery" } },
      { $group: { _id: "$stars", count: { $sum: 1 } } }
    ];

    // Execute the aggregation
    const aggCursor = coll.aggregate(pipeline);

    // Print the aggregated results
    for await (const doc of aggCursor) {
      console.log(doc);
    }
  });
```

Here we establish a cursor by executing an aggregtion pipeline on our collection.
We then loop over each output document and print it to the console:

```bash
{ _id: 3, count: 1 }
{ _id: 4, count: 2 }
{ _id: 5, count: 1 }
```
