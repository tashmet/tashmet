import Tashmet from '@tashmet/tashmet';
import mingo from '@tashmet/mingo-aggregation';
import Memory from '@tashmet/memory';

async function helloWorld(tashmet: Tashmet) {
  const db = tashmet.db('hello-world');
  const posts = db.collection('posts');
  await posts.insertOne({title: 'Hello World!'});
  const doc = await posts.find().next();
  console.log(doc);
}

const store = Memory
  .configure({})
  .use(mingo())
  .bootstrap();

const tashmet = new Tashmet(store);

helloWorld(tashmet);
