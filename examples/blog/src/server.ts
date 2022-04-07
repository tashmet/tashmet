import Tashmet, {LogLevel, provider, StorageEngine, Store, StoreConfig} from '@tashmet/tashmet';
import Mingo from '@tashmet/mingo';
import Nabu, { yaml } from '@tashmet/nabu';
import Vinyl from '@tashmet/vinyl';
import HttpServer, {QueryParser} from '@tashmet/http-server';
import {terminal} from '@tashmet/terminal';

@provider({key: StorageEngine})
class ServerBlogStorageEngine extends StorageEngine {
  public constructor(private nabu: Nabu, private mingo: Mingo) { super(); }

  public createStore(config: StoreConfig): Store<any> {
    const options = config.options || {}

    if (config.ns.db === 'blog') {
      const yamlConfig = 'contentKey' in options
        ? {frontMatter: true, contentKey: options.contentKey }
        : {};

      return this.nabu.directoryContent({
        path: `/home/bander10/Documents/tashmet/examples/${config.ns.db}/${config.ns.coll}`,
        extension: 'yaml',
        serializer: yaml(yamlConfig),
        ...config
      });
    }
    return this.mingo.createStore(config);
  }
}

@provider()
class ServerBlogApp {
  public constructor(private server: HttpServer, private tashmet: Tashmet) {}

  public run(port: number) {
    const db = this.tashmet.db('blog');
    const posts = db.createCollection('posts', {storageEngine: {contentKey: 'articleBody'}});
    this.server
      .resource('/api/posts', {collection: posts})
      .listen(port);
  }
}

Tashmet
  .configure({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
  })
  .use(Mingo, {})
  .use(Nabu, {})
  .use(Vinyl, {watch: false})
  .use(HttpServer, {queryParser: QueryParser.flat()})
  .provide(ServerBlogStorageEngine)
  .bootstrap(ServerBlogApp)
  .then(app => app.run(8000));
