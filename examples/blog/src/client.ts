import Tashmet from '@tashmet/tashmet';
import Client from '@tashmet/client';

async function runClient(tashmet: Tashmet) {
  const db = tashmet.db('blog');
  const posts = db.collection('posts');
  const docs = await posts.find({}).toArray();
  console.log(docs);
}

const tashmet = new Tashmet(new Client({ uri: 'http://localhost:8080' }));

runClient(tashmet);
