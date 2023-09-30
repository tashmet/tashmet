import Tashmet from '@tashmet/tashmet';
import Mingo from '@tashmet/mingo-aggregation';
import Memory from '@tashmet/memory';

async function helloWorld(tashmet: Tashmet) {
  const db = tashmet.db('hello-world');
  const posts = db.collection('posts');
  await posts.insertOne({title: 'Hello World!'});
  const doc = await posts.find().next();
  console.log(doc);
}

const tashmet = Tashmet
  .configure()
  .use(Mingo, {})
  .use(Memory, {})
  .bootstrap();

helloWorld(tashmet);
