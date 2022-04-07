import Tashmet from '@tashmet/tashmet';
import Mingo from '@tashmet/mingo';

Tashmet
  .configure()
  .use(Mingo, {})
  .connect()
  .then(async tashmet => {
    const db = tashmet.db('hello-world');
    const posts = db.collection('posts');
    await posts.insertOne({title: 'Hello World!'});
    const doc = await posts.find().next();

    console.log(doc);
  });
