import Tashmet from '@tashmet/tashmet';
import Mingo from '@tashmet/mingo';

Tashmet
  .configure()
  .use(Mingo, {})
  .connect()
  .then(async tashmet => {
    const db = tashmet.db('hello-world');
    const doc = await db.collection('posts').insertOne({title: 'Hello World!'});
    console.log(doc);
  });
