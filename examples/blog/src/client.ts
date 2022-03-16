import Tashmit, {LogLevel, provider, StorageEngine, StoreConfig} from '@tashmit/tashmit';
import Memory from '@tashmit/memory';
import Caching from '@tashmit/caching';
import HttpClient, {QuerySerializer} from '@tashmit/http-client';
import operators from '@tashmit/operators/basic';
import {terminal} from '@tashmit/terminal';
import isomorphicFetch from 'isomorphic-fetch';

@provider({key: StorageEngine})
class ClientBlogStorageEngine implements StorageEngine {
  public constructor(private http: HttpClient, private memory: Memory) {}

  public createStore<TSchema>(config: StoreConfig) {
    if (config.ns.db === 'blog') {
      return this.http.createApi({path: `http://localhost:8000/api/${config.ns.coll}`, ...config})
    }
    return this.memory.createStore<TSchema>(config);
  }
}

Tashmit
  .configure({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
  })
  .use(Memory, {operators})
  .use(HttpClient, {
    querySerializer: QuerySerializer.flat(),
    fetch: isomorphicFetch,
  })
  .use(Caching, {})
  .provide(ClientBlogStorageEngine)
  .connect()
  .then(async tashmit => {
    const db = tashmit.db('blog');
    const posts = db.collection('posts');
    let doc = await posts.findOne({_id: 'helloworld'});
    doc = await posts.findOne({_id: 'helloworld'});
    console.log(doc);
  })
