import Tashmit, {Logger, LogLevel, provider} from '@tashmit/tashmit';
import FileClient, { yaml } from '@tashmit/file';
import Vinyl from '@tashmit/vinyl';
import HttpServer, {QueryParser} from '@tashmit/http-server';
import {terminal} from '@tashmit/terminal';

@provider({
  inject: [HttpServer, FileClient, Logger.inScope('Application')],
})
export class Application {
  constructor(
    private server: HttpServer,
    private client: FileClient,
    private logger: Logger
  ) {}

  async run(port: number) {
    try {
      const posts = this.client
        .db('blog')
        .directoryContent('posts', {
          path: 'posts',
          extension: 'yaml',
          serializer: yaml({frontMatter: true, contentKey: 'articleBody'}),
        });
      this.server
        .resource('/api/posts', {collection: posts})
        .listen(port);
    } catch (err) {
      this.logger.error(err.message);
    }
  }
}

Tashmit
  .withConfiguration({
    logLevel: LogLevel.Debug,
    logFormat: terminal()
  })
  .use(HttpServer, {queryParser: QueryParser.flat()})
  .use(FileClient, {})
  .use(Vinyl, {watch: false})
  .provide(Application)
  .bootstrap(Application, app => app.run(8000));
