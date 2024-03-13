# Tashmet

This is the Tashmet mono-repo, containing code and tests for
the Tashmet database.

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

To illustate the basics lets first look at a simple example where we configure
a storage engine without any persistent storage and insert a document into it. 
The default storage engine is called Nabu and it will fall back to memory if 
not configured otherwise.

First we need to tell it to use mingo as its aggregation engine.
We then connect to the storage engine directly, using its proxy interface. 
Note that no network connection is made in this example.

```ts
import Tashmet from '@tashmet/tashmet';
import mingo from '@tashmet/mingo';
import Nabu from '@tashmet/nabu';

const store = Nabu
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
import Nabu from '@tashmet/nabu';

const store = Nabu
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

## File system persistence

### Persistent database configuration

One important aspect of the Nabu  storage engine is that the state of the
databases, ie which collections they have and how they are set up, can be persisted to disk in human
readable form. If you don't need to create databases and collections dynamically
at runtime it's probably more convenient to just craft a configuration file by
hand in yaml.

The following configuration option will tell Nabu to look up a database
configuration in a yaml file with the same name as the database.

```typescript
const store = Nabu
  .configure({
    dbFile: db => `${db}.yaml`
  })
  // ...
```

Let's create a database configuration file called *mydb.yaml* where we can
define the configuration for each of our collections. Here we specify that
documents should be stored in .md-files with yaml frontmatter within a
specific directory.

```yaml
collections:
  posts:
    storageEngine:
      directory:
        path: ./content/posts
        extension: .md
        format:
          frontmatter: yaml
```

When we connect to the database are use the *posts* collection all data will be
written to and read from the files in the directory specified.

```typescript
Tashmet
  .connect(store.proxy())
  .then(async tashmet =>  {
    const db = tashmet.db('mydb');
    const posts = await db.collection('posts');
```

### Dynamically created collections

The same can also be done at runtime using a storageEngine option when creating
collections.

```typescript
Tashmet.connect(store.proxy()).then(async tashmet => {
  const collection = await tashmet.db('myDb').createCollection('myCollection', {
    storageEngine: {
      directory: {
        path: 'content/myCollection',
        extension: '.yaml',
        format: 'yaml'
      }
    }
  });
});
```
