import Tashmet, {LogLevel} from '@tashmet/tashmet';
import Mingo from '@tashmet/mingo-aggregation';
//import Caching from '@tashmet/caching';
import HttpClient, {QuerySerializer} from '@tashmet/http-client';
import { terminal } from '@tashmet/terminal';
import isomorphicFetch from 'isomorphic-fetch';

Tashmet
  .configure({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
  })
  .use(Mingo, {})
  .use(HttpClient, {
    querySerializer: QuerySerializer.flat(),
    fetch: isomorphicFetch,
    databases: {
      'blog': {
        path: coll => `http://localhost:8000/api/${coll}`,
      }
    }
  })
  //.use(Caching, {})
  .connect()
  .then(async tashmet => {
    const db = tashmet.db('blog');
    const posts = db.collection('posts');
    await posts.find({}).toArray();
    const doc = await posts.findOne({_id: 'helloworld'});
    console.log(doc);
  });
