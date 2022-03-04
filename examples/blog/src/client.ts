import Tashmit, {Logger, LogLevel, provider} from '@tashmit/tashmit';
import MemoryClient from '@tashmit/memory';
import Caching from '@tashmit/caching';
import HttpClient, {QuerySerializer} from '@tashmit/http-client';
import operators from '@tashmit/operators/basic';
import {terminal} from '@tashmit/terminal';
import isomorphicFetch from 'isomorphic-fetch';

@provider({
  inject: [HttpClient, Logger.inScope('Application')],
})
export class Application {
  constructor(private client: HttpClient, private logger: Logger) {}

  async run() {
    const db = this.client.db('blog');
    const posts = await db.createCollection('posts', {
      path: 'http://localhost:8000/api/posts',
    });
    const doc = await posts.findOne({_id: 'helloworld'});
    console.log(doc);
  }
}

Tashmit
  .withConfiguration({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
  })
  .provide(Application)
  .use(MemoryClient, {operators})
  .use(HttpClient, {
    querySerializer: QuerySerializer.flat(),
    fetch: isomorphicFetch,
  })
  .use(Caching, {})
  .bootstrap(Application, app => app.run());
