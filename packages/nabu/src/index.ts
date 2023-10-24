import {
  BootstrapConfig,
  Container,
  createContainer,
  LogLevel,
  Lookup,
  PluginConfigurator,
  Provider,
  provider
} from '@tashmet/core';
import {
  AggregationCursor,
  Document,
  Namespace,
  GlobalAggregationCursor,
  TashmetCollectionNamespace
} from '@tashmet/tashmet';
import {
  AggregationEngine,
  ViewMap,
  AdminController,
  AggregationReadController,
  AggregationWriteController,
  QueryPlanner,
  Store,
  StorageEngine,
  CollectionFactory,
  ReadWriteCollection,
  CommandRunner,
} from '@tashmet/engine';
import Json from '@tashmet/json';
import Yaml from '@tashmet/yaml';
import Fs from '@tashmet/fs';
import { MemoryCollectionFactory } from '@tashmet/memory';
import {
  FileAccess,
  NabuConfig,
  NabuDatabaseConfig,
} from './interfaces.js';
import { ContentRule } from './content.js';
import { FileCollectionFactory } from './storage/fileStorage.js';
import { fs } from './io/fs.js';
import { yaml } from './content/yaml.js';
import { json } from './content/json.js';

export * from './interfaces.js';
export { ContentRule };
export { IO } from './io.js';

@provider()
export default class Nabu extends StorageEngine {
  public static fs = fs;
  public static json = json;
  public static yaml = yaml;

  private commandRunner: CommandRunner;

  public constructor(
    private engine: AggregationEngine,
    private store: Store,
    collectionFactory: CollectionFactory,
  ) {
    super();
    const views: ViewMap = {};
    this.commandRunner = CommandRunner.fromControllers(
      new AdminController(store, collectionFactory, views),
      new AggregationReadController(this.engine, views),
      new AggregationWriteController(store, this.engine)
    );
    this.store.on('change', doc => this.emit('change', doc));
    //this.databases['__tashmet'] = DatabaseEngine.fromControllers('__tashmet',
      //new AggregationReadController('__tashmet', engine, views),
    //);
  }

  public static configure(config: Partial<BootstrapConfig> & Partial<NabuConfig>) {
    return new NabuConfigurator(createContainer({logLevel: LogLevel.None, ...config}), config)
      .use(Fs({ watch: false }))
      .use(Json(config.json || {}))
      .use(Yaml(config.yaml || {}))
  }

  public command(ns: Namespace, command: Document): Promise<Document> {
    return this.commandRunner.command(new TashmetCollectionNamespace(ns.db, ns.coll), command);
  }

  public aggregate(collection: Document[], pipeline: Document[]): AggregationCursor<Document> {
    return new GlobalAggregationCursor(collection, this.proxy(), pipeline);
  }

  public glob(pattern: string | string[], pipeline: Document[] = []): AggregationCursor<Document> {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];

    return this.aggregate(patterns.map(p => ({_id: p})), [
      { $glob: { pattern: '$_id' } },
      ...pipeline
    ]);
  }
}

@provider({
  inject: [FileCollectionFactory, MemoryCollectionFactory, NabuConfig]
})
export class NabuCollectionFactory extends CollectionFactory {
  public constructor(
    private file: FileCollectionFactory,
    private memory: MemoryCollectionFactory,
    private config: NabuConfig,
  ) { super(); }

  public createCollection(ns: TashmetCollectionNamespace, options: any): ReadWriteCollection {
    if (ns.db in this.config.databases) {
      return this.file.createCollection(ns, options);
    }
    return this.memory.createCollection(ns, options);
  }
}


export class NabuConfigurator extends PluginConfigurator<Nabu> {
  public config: NabuConfig = { databases: {}, json: {}, yaml: {} };

  public constructor(container: Container, config: Partial<NabuConfig>) {
    super(Nabu, container);
    this.config = {...this.config, ...config};
  }

  public database(name: string, config: NabuDatabaseConfig): this {
    this.config.databases[name] = config;
    return this;
  }

  public register() {
    this.container.register(FileAccess);
    this.container.register(AggregationEngine);
    this.container.register(QueryPlanner);
    this.container.register(Provider.ofInstance(NabuConfig, this.config));
    this.container.register(MemoryCollectionFactory);
    this.container.register(FileCollectionFactory);
    this.container.register(NabuCollectionFactory);
    this.container.register(Provider.ofResolver(CollectionFactory, Lookup.of(NabuCollectionFactory)));

    if (!this.container.isRegistered(Store)) {
      this.container.register(Store);
    }
  }
}
