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
