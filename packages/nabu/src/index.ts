import { AggregationCursor } from '@tashmet/tashmet';
import { Logger, provider } from '@tashmet/core';
import { Dispatcher, Document, Namespace, Store } from '@tashmet/bridge';
import {
  AggregatorFactory,
  AggregationEngine,
  ViewMap,
  AdminController,
  AggregationReadController,
  AggregationWriteController,
  QueryPlanner,
  StorageEngine,
  DocumentAccess,
} from '@tashmet/engine';
import Json from '@tashmet/json';
import Yaml from '@tashmet/yaml';
import Fs from '@tashmet/fs';
import {
  FileAccess,
  NabuConfig,
  NabuDatabaseConfig,
} from './interfaces.js';
import { ContentRule } from './content.js';
import { FileStorage } from './storage/fileStorage.js';
import { fs } from './io/fs.js';
import { yaml } from './content/yaml.js';
import { json } from './content/json.js';

export * from './interfaces.js';
export { ContentRule };
export { IO } from './io.js';

import { BootstrapConfig, Container, createContainer, LogLevel, PluginConfigurator, Provider } from '@tashmet/core';
import { GlobalAggregationCursor } from '@tashmet/tashmet/dist/cursor/globalAggregationCursor.js';
import Memory from '@tashmet/memory';


@provider()
export default class Nabu extends Store {
  private databases: Record<string, StorageEngine> = {};

  public constructor(
    private aggFact: AggregatorFactory,
    private documentAccess: DocumentAccess,
    private logger: Logger,
    private config: NabuConfig,
    private memory: Memory,
  ) {
    super();
    const engine = new AggregationEngine(
      aggFact, new QueryPlanner(documentAccess, logger.inScope('QueryPlanner')), '__tashmet');
    const views: ViewMap = {};
    this.databases['__tashmet'] = StorageEngine.fromControllers('__tashmet',
      new AggregationReadController('__tashmet', engine, views),
    );
  }

  public static configure(config: Partial<BootstrapConfig> & Partial<NabuConfig>) {
    return new NabuConfigurator(createContainer({logLevel: LogLevel.None, ...config}), config)
      .use(Fs({ watch: false }))
      .use(Json())
      .use(Yaml({}))
      .provide(Memory);
  }

  public command(ns: Namespace, command: Document): Promise<Document> {
    if (!this.databases[ns.db]) {
      let store: StorageEngine;

      if (ns.db in this.config.databases) {
        store = this.createStorageEngine(ns.db);
      } else {
        store = this.memory.createStorageEngine(ns.db);
      }
      store.on('change', change => this.emit('change', change));
      this.databases[ns.db] = store;
    }

    return this.databases[ns.db].command(command);
  }

  public createStorageEngine(dbName: string): StorageEngine {
    const config = this.config.databases[dbName];
    const storage = new FileStorage(dbName, this, config);

    const engine = new AggregationEngine(
      this.aggFact, new QueryPlanner(this.documentAccess, this.logger.inScope('QueryPlanner')), dbName);
    const views: ViewMap = {};
    this.documentAccess.addStreamable(dbName, storage);
    this.documentAccess.addWritable(dbName, storage);
    return StorageEngine.fromControllers(dbName,
      new AdminController(dbName, storage, views),
      new AggregationReadController(dbName, engine, views),
      new AggregationWriteController(dbName, storage, engine)
    );
  }

  public aggregate(collection: Document[], pipeline: Document[]): AggregationCursor<Document> {
    return new GlobalAggregationCursor(collection, this, pipeline);
  }

  public glob(pattern: string | string[], pipeline: Document[] = []): AggregationCursor<Document> {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];

    return this.aggregate(patterns.map(p => ({_id: p})), [
      { $glob: { pattern: '$_id' } },
      ...pipeline
    ]);
  }

  public static fs = fs;
  public static json = json;
  public static yaml = yaml;
}

export class NabuConfigurator extends PluginConfigurator<Nabu> {
  public config: NabuConfig = { databases: {} };

  public constructor(container: Container, config: Partial<NabuConfig>) {
    super(Nabu, container);
    this.config = {...this.config, ...config};
  }

  public database(name: string, config: NabuDatabaseConfig): this {
    this.config.databases[name] = config;
    return this;
  }

  public register() {
    this.container.register(Nabu);
    this.container.register(FileAccess);
    this.container.register(Provider.ofInstance(NabuConfig, this.config));

    if (!this.container.isRegistered(DocumentAccess)) {
      this.container.register(DocumentAccess);
    }
    if (!this.container.isRegistered(Dispatcher)) {
      this.container.register(Dispatcher);
    }
  }
}
