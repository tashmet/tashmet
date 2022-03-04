import Tashmit from '@tashmit/tashmit';
import MemoryClient from '@tashmit/memory';

new Tashmit()
  .use(MemoryClient, {})
  .bootstrap(MemoryClient, async client => {
    const db = client.db('hello-world');
    const doc = await db.collection('posts').insertOne({title: 'Hello World!'});
    console.log(doc);
  });
