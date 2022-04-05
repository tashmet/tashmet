import Tashmet, {LogLevel, provider, StorageEngine, StoreConfig} from '@tashmet/tashmet';
import Mingo from '@tashmet/mingo';
import Caching from '@tashmet/caching';
import HttpClient, {QuerySerializer} from '@tashmet/http-client';
import {terminal} from '@tashmet/terminal';
import isomorphicFetch from 'isomorphic-fetch';

@provider({key: StorageEngine})
class ClientBlogStorageEngine extends StorageEngine {
  public constructor(private http: HttpClient, private mingo: Mingo) { super(); }

  public createStore<TSchema>(config: StoreConfig) {
    if (config.ns.db === 'blog') {
      return this.http.createApi({path: `http://localhost:8000/api/${config.ns.coll}`, ...config})
    }
    return this.mingo.createStore<TSchema>(config);
  }
}

Tashmet
  .configure({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
  })
  .use(Mingo, {})
  .use(HttpClient, {
    querySerializer: QuerySerializer.flat(),
    fetch: isomorphicFetch,
  })
  .use(Caching, {})
  .provide(ClientBlogStorageEngine)
  .connect()
  .then(async tashmet => {
    const db = tashmet.db('blog');
    const posts = db.collection('posts');
    let doc = await posts.findOne({_id: 'helloworld'});
    doc = await posts.findOne({_id: 'helloworld'});
    console.log(doc);
  })
