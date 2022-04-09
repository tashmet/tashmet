# Aggregation

### Overview

Aggregations are supported when using Mingo, HTTP with caching (client-side) and Nabu. See the [MongoDB docs](https://www.mongodb.com/docs/drivers/node/current/fundamentals/aggregation/) for details.

### Examples

The following example is available in the [repo](https://github.com/tashmet/tashmet/tree/master/examples/aggregation).

```typescript
import Tashmet from '@tashmet/tashmet';
import Mingo from '@tashmet/mingo';
import 'mingo/init/system';

Tashmet
  .configure()
  .use(Mingo, {})
  .connect()
  .then(async tashmet => {
    const db = tashmet.db('aggregation');
    const coll = db.collection('restaurants');

    const docs = [
      { stars: 3, categories: ["Bakery", "Sandwiches"], name: "Rising Sun Bakery" },
      { stars: 4, categories: ["Bakery", "Cafe", "Bar"], name: "Cafe au Late" },
      { stars: 5, categories: ["Coffee", "Bakery"], name: "Liz's Coffee Bar" },
      { stars: 3, categories: ["Steak", "Seafood"], name: "Oak Steakhouse" },
      { stars: 4, categories: ["Bakery", "Dessert"], name: "Petit Cookie" },
    ];
    await coll.insertMany(docs);

    const pipeline = [
      { $match: { categories: "Bakery" } },
      { $group: { _id: "$stars", count: { $sum: 1 } } }
    ];
    const aggCursor = coll.aggregate(pipeline);
    for await (const doc of aggCursor) {
      console.log(doc);
    }
  });

```

The above example should yield the following output

```typescript
{ _id: 3, count: 1 }
{ _id: 4, count: 2 }
{ _id: 5, count: 1 }
```
