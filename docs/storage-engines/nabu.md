---
description: Reading and writing content stored on disk
---

# Nabu

## Introduction

File is a set of tools for reading and writing Tashmet content on disk. It allows us to store collections in files with support for common formats like JSON, YAML or Markdown.

### Installation

```
$ npm install @tashmet/nabu
```

### JSON

Lets start with the most simple example where we choose to store our documents as JSON-files in directories unique to each collection.

We start by configuring our storage engine with an input/output adapter called 'json' that works with JSONN files in a sub-directories of the current working directory where the relative path is given by the database name and collection name of the namespace of the collection created.

```typescript
import mingo from '@tashmet/mingo';
import Nabu from '@tashmet/nabu';
import Tashmet from '@tashmet/tashmet';
import { terminal } from '@tashmet/terminal';

const store = Nabu
  .configure({})
  .use(mingo())
  .io('json', ns => Nabu
    .json()
    .directory(`${ns.db}/${ns.collection}`)
  )
  .bootstrap();
```

Next step is to connect to our storage engine proxy and create a collection.

```typescript
const tashmet = Tashmet
  .connect(store.proxy())
  .then(async tashmet => {
    const inventory = await client.db('mydb').createCollection('inventory', {
      storageEngine: { io: 'json' }
    });
  });
```

Notice that we pass a storageEngine option here to let Nabu know that the io-adapter that should be used is the one we created earlier. If we were to omit this directive then Nabu would fallback to memory storage which is the default option. If we always want to use the 'json'-adapter by default we could instead configure the default fallback on Nabu:

```typescript
const store = Nabu
  .configure({
    defaultIO: 'json'
  })
  ...
```

Now let's add some documents to our collection:

```typescript
await inventory.insertMany([
  {_id: '1', item: { category: 'cake', type: 'chiffon' }, amount: 10 },
  {_id: '2', item: { category: 'cookies', type: 'chocolate chip'}, amount: 50 },
  {_id: '3', item: { category: 'cookies', type: 'chocolate chip'}, amount: 15 },
  {_id: '4', item: { category: 'cake', type: 'lemon' }, amount: 30 },
  {_id: '5', item: { category: 'cake', type: 'carrot' }, amount: 20 },
]);
```

#### Markdown + YAML

In this example we want to store our files as Markdown with YAML front matter. We can do this by configuring a YAML io-adapter to handle front matter. Here we also define a contentKey which is the field on the parsed document where the raw markdown content should be stored. To make things a bit more interesting we will allow the creator of collections to optionally specify a custom contentKey as we will see later.

```typescript
import Nabu from '@tashmet/nabu';
import Tashmet from '@tashmet/tashmet';
import mingo from '@tashmet/mingo';

const store = Nabu
  .configure({})
  .use(mingo())
  .io('md+yaml', (ns, options) => Nabu
    .yaml({
      frontMatter: true,
      contentKey: options.contentKey || 'content',
    })
    .directory(`${ns.db}/${ns.collection}`, '.md')
  )
  .bootstrap();
```

Let's create a collection. We use our adapter and also specify a custom contentKey that will override the default one.

```typescript
Tashmet
  .connect(store.proxy())
  .then(async tashmet =>  {
    const db = tashmet.db('content');
    const posts = await db.createCollection('posts', {
      storageEngine: {
        io: 'md+yaml',
        contentKey: 'articleBody',
      }
    });
```

Now, consider we already have a document sitting in the content/posts directory.

```yaml
---
datePublished: '2020-03-22T22:49:33.610Z'
--- 
Hello World!
```

What we want to do now is access that document and also convert the markdown to html with an aggregation pipeline.

```typescript
const cursor = posts.aggregate([
  { $set: { html: { $markdownToHtml: '$articleBody' } } }
]);

for await (const doc of cursor) {
  console.log(doc);
}
```

The output will be the following:

```bash
{
  _id: 'helloworld',
  datePublished: '2020-03-22T22:49:33.610Z',
  articleBody: 'Hello World!',
  html: '<p>Hello World!</p>'
}
```
