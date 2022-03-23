import Tashmit, {LogLevel, provider, StorageEngine, Store, StoreConfig} from '@tashmit/tashmit';
import Memory from '@tashmit/memory';
import FileSystem, { yaml } from '@tashmit/file';
import Vinyl from '@tashmit/vinyl';
import HttpServer, {QueryParser} from '@tashmit/http-server';
import {terminal} from '@tashmit/terminal';

@provider({key: StorageEngine})
class ServerBlogStorageEngine implements StorageEngine {
  public constructor(private fs: FileSystem, private memory: Memory) {}

  public createStore(config: StoreConfig): Store<any> {
    const options = config.options || {}

    if (config.ns.db === 'blog') {
      const yamlConfig = 'contentKey' in options
        ? {frontMatter: true, contentKey: options.contentKey }
        : {};

      return this.fs.directoryContent({
        path: `/home/bander10/Documents/tashmit/examples/${config.ns.db}/${config.ns.coll}`,
        extension: 'yaml',
        serializer: yaml(yamlConfig),
        ...config
      });
    }
    return this.memory.createStore(config);
  }
}

@provider()
class ServerBlogApp {
  public constructor(private server: HttpServer, private tashmit: Tashmit) {}

  public run(port: number) {
    const db = this.tashmit.db('blog');
    const posts = db.createCollection('posts', {storageEngine: {contentKey: 'articleBody'}});
    this.server
      .resource('/api/posts', {collection: posts})
      .listen(port);
  }
}

Tashmit
  .configure({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
  })
  .use(Memory, {})
  .use(FileSystem, {})
  .use(Vinyl, {watch: false})
  .use(HttpServer, {queryParser: QueryParser.flat()})
  .provide(ServerBlogStorageEngine)
  .bootstrap(ServerBlogApp)
  .then(app => app.run(8000));
