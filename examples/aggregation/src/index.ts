import Tashmet from '@tashmet/tashmet';
import Mingo from '@tashmet/mingo-aggregation';
import Memory from '@tashmet/memory';

async function aggregation(tashmet: Tashmet) {
  const db = tashmet.db('aggregation');
  const coll = db.collection('restaurants');

  const docs = [
    { stars: 3, categories: ["Bakery", "Sandwiches"], name: "Rising Sun Bakery" },
    { stars: 3, categories: ["Bakery", "Sandwiches"], name: "Rising sun 2" },
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
}

aggregation(Tashmet
  .configure({})
  .use(Mingo, {})
  .use(Memory, {})
  .bootstrap());
