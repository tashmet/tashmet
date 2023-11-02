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
