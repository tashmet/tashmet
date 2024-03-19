---
description: Working with JSON files
---

# JSON

## Example

Lets start with the most simple example where we choose to store our documents as JSON-files in directories unique to each collection.

We start by configuring our storage engine with an input/output adapter called 'json' that works with JSON files in a sub-directories of the current working directory where the relative path is given by the database name and collection name of the namespace of the collection created.

```typescript
import Tashmet from '@tashmet/tashmet';
import Nabu from '@tashmet/nabu';
import mingo from '@tashmet/mingo';

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
