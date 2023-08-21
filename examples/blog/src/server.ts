import Tashmet, {LogLevel, provider} from '@tashmet/tashmet';
import Mingo from '@tashmet/mingo-stream';
import Nabu from '@tashmet/nabu';
import NabuYaml from '@tashmet/nabu-yaml';
import Vinyl from '@tashmet/nabu-vinyl';
import HttpServer, {QueryParser} from '@tashmet/http-server';
import {terminal} from '@tashmet/terminal';

@provider()
class ServerBlogApp {
  public constructor(private server: HttpServer, private tashmet: Tashmet) {}

  public async run(port: number) {
    const db = this.tashmet.db('blog');

    this.server
      .resource('/api/posts', {collection: db.collection('posts')})
      .listen(port);
  }
}

Tashmet
  .configure({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
  })
  .use(Mingo, {})
  .use(Nabu, {
    databases: {
      blog: {
        documentBundle: (coll, id) => `./examples/blog/${coll}/${id ? id : '*'}.md`,
      },
    }
  })
  .use(NabuYaml, {
    rules: [
      { match: '*.md', frontMatter: true, contentKey: 'articleBody' },
    ]
  })
  .use(Vinyl, {watch: false})
  .use(HttpServer, {queryParser: QueryParser.flat()})
  .bootstrap(ServerBlogApp)
  .then(app => app.run(8000));
