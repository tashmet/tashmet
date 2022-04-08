---
description: Storage engine connected to a RESTful API
---

# HTTP

## HTTP Client

Setting up Tashmet to use HTTP means we can communicate with an API like it was a MongoDB collection with some restrictions. Unlike when using the mingo plugin, for HTTP we have to set up a custom storage engine that is able to map namespaces (database name and collection name) to actual endpoints.&#x20;

{% hint style="warning" %}
**Limitations**

* Queries against the database will naturally be limited to the restrictions in the underlying API endpoints. See [query serialization](query-serialization.md) for more information.
* Aggregation is only possible when combined with a [caching layer](caching.md). In that configuration aggregation will be done client-side.
{% endhint %}

### Getting started

In the following example we allow a single database called "example" to be created and map its collections to different paths on localhost.

```typescript
import Tashmet, {provider, StorageEngine, StoreConfig} from '@tashmet/tashmet';
import HttpClient, {QuerySerializer} from '@tashmet/http-client';

@provider({key: StorageEngine})
class ClientStorageEngine extends StorageEngine {
  public constructor(private http: HttpClient) { super(); }

  public createStore<TSchema>(config: StoreConfig) {
    if (config.ns.db === 'example') {
      return this.http.createApi({path: `http://localhost:8000/api/${config.ns.coll}`, ...config})
    }
    throw new Error(`No storage engine configured for DB: ${config.ns.db}`});
}

Tashmet
  .use(HttpClient, {
    querySerializer: QuerySerializer.flat(),
  })
  .provide(ClientStorageEngine)
  .connect()
  .then(async tashmet => {
    const db = tashmet.db('example');
    const posts = db.collection('posts');
    const doc = await posts.findOne({_id: 'helloworld'});
    console.log(doc);
  })

```

