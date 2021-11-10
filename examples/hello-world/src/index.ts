import Tashmit, {Database} from '@tashmit/tashmit';

new Tashmit().bootstrap(Database, async database => {
  const doc = await database.collection('posts').insertOne({title: 'Hello World!'});
  console.log(doc);
});
