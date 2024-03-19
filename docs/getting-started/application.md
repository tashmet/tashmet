# Creating an application

## Installation

In your project, use npm to install the package.

```
$ npm install @tashmet/tashmet
```

## Your first application

In the following example we will set up the client to use an in-memory database, create a collection and insert a document into it.

```typescript
import Tashmet from '@tashmet/tashmet';
import Mingo from '@tashmet/mingo';

Tashmet
  .configure()
  .use(Mingo, {})
  .connect()
  .then(async tashmet => {
    const db = tashmet.db('hello-world');
    const doc = await db.collection('posts').insertOne({title: 'Hello World!'});
    console.log(doc);
  });

```

The application is set up to use the Mingo plugin which supplies a default storage engine in memory.
