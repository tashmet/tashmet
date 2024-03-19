---
description: Working with YAML & Markdown
---

# YAML & Markdown

## Example

In this example we want to store our files as Markdown with YAML front matter. We can do this by configuring a YAML io-adapter to handle front matter. Here we also define a contentKey which is the field on the parsed document where the raw markdown content should be stored. To make things a bit more interesting we will allow the creator of collections to optionally specify a custom contentKey as we will see later.

```typescript
import Tashmet from '@tashmet/tashmet';
import Nabu from '@tashmet/nabu';
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
