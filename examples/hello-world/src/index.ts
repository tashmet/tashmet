import Tashmet from '@tashmet/tashmet';
import Memory from '@tashmet/memory';

Tashmet
  .configure()
  .use(Memory, {})
  .connect()
  .then(async tashmet => {
    const db = tashmet.db('hello-world');
    const doc = await db.collection('posts').insertOne({title: 'Hello World!'});
    console.log(doc);
  });
