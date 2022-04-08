# Caching

When working with remote data it is helpful to have some caching in place so that we don't have to fetch the same data over and over. By incorporating a caching layer using in-memory storage, we can both optimize for speed and also gain access to client-side aggregation capabilities.

#### Installation

```
npm install @tashmet/caching
```

#### Usage

```typescript
import Caching from '@tashmet/caching';
...
const tashmet = await Tashmet
  .configure({logLevel: LogLevel.None})
  .use(Mingo, {})
  .use(HttpClient, {fetch})
  .use(Caching, {})
  .provide(RestClientStorageEngine)
  .connect();
```
