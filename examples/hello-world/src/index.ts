import Tashmit from '@tashmit/tashmit';
import Memory from '@tashmit/memory';

Tashmit
  .configure()
  .use(Memory, {})
  .connect()
  .then(async tashmit => {
    const db = tashmit.db('hello-world');
    const doc = await db.collection('posts').insertOne({title: 'Hello World!'});
    console.log(doc);
  });
