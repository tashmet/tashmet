import Tashmet from '@tashmet/tashmet';
import ServerProxy from '@tashmet/proxy';

async function runClient(tashmet: Tashmet) {
  const db = tashmet.db('blog');
  const posts = db.collection('posts');
  const docs = await posts.find({}).toArray();
  console.log(docs);
}

const tashmet = new Tashmet(new ServerProxy({ uri: 'http://localhost:8080' }));

runClient(tashmet);
