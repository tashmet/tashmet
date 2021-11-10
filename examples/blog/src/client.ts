import Tashmit, {Database, Logger, LogLevel, provider} from '@tashmit/tashmit';
import {caching} from '@tashmit/caching';
import HttpClient, {QuerySerializer} from '@tashmit/http-client';
import operators from '@tashmit/operators/basic';
import {terminal} from '@tashmit/terminal';
import isomorphicFetch from 'isomorphic-fetch';

@provider({
  inject: [Database, Logger.inScope('Application')],
})
export class Application {
  constructor(private database: Database, private logger: Logger) {}

  async run() {
    try {
      const posts = await this.database.collection('posts');
      const doc = await posts.findOne({_id: 'helloworld'});
      await posts.insertOne({_id: 'test'});
      console.log(doc);
    } catch (err) {
      this.logger.error(err.message);
    }
  }
}

Tashmit
  .withConfiguration({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
    operators,
  })
  .collection('posts', HttpClient.collection('http://localhost:8000/api/posts'))
  .use(caching())
  .provide(
    Application,
    new HttpClient({
      querySerializer: QuerySerializer.flat(),
      fetch: isomorphicFetch,
    })
  )
  .bootstrap(Application, app => app.run());
