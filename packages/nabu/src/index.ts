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
  TashmetNamespace
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
  CommandRunner,
} from '@tashmet/engine';
import Json from '@tashmet/json';
import Yaml from '@tashmet/yaml';
import Fs from '@tashmet/fs';
import Markdown from '@tashmet/markdown';
import { MemoryCollectionFactory } from '@tashmet/memory';
import {
  IODescription,
  NabuConfig,
  NabuIOConfig,
  StreamIO,
} from './interfaces.js';
import { NabuCollectionFactory } from './storage/index.js';
import { makeIO } from './io/index.js';

export * from './interfaces.js';

@provider()
export default class Nabu extends StorageEngine {
  private commandRunner: CommandRunner;

  constructor(
    engine: AggregationEngine,
    private store: Store,
    private collectionFactory: CollectionFactory,
  ) {
    super();
    const views: ViewMap = {};
    this.commandRunner = CommandRunner.fromControllers(
      new AdminController(store, collectionFactory, views),
      new AggregationReadController(engine, views),
      new AggregationWriteController(store, engine)
    );
    this.store.on('change', doc => this.emit('change', doc));
  }

  static configure(config: Partial<BootstrapConfig> & Partial<NabuConfig>) {
    return new NabuConfigurator(createContainer({logLevel: LogLevel.None, ...config}), config)
      .use(Fs(config.fs))
      .use(Json(config.json))
      .use(Yaml(config.yaml))
      .use(Markdown(config.markdown))
  }

  /**
   * Run a command against the storage enegine
   */
  async command(ns: TashmetNamespace, command: Document): Promise<Document> {
    await this.initNamespace(ns);

    return this.commandRunner.command(ns, command);
  }

  /**
   * Run a glob search for files on the file system
   * 
   * The resulting cursor will contain documents with only an _id field
   * that is the path of the file
   * 
   * @example
   * 
   * Stat all JSON files in the current directory
   * 
   * ```typescript
   * const cursor = nabu.glob('*.json').project({ stat: { $lstat: '$_id' } });
   *
   * 
   * @param pattern One or more glob patterns
   * @param pipeline Optional pipeline
   * @returns An aggregation cursor
   */
  glob(pattern: string | string[], pipeline: Document[] = []): AggregationCursor<Document> {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];

    return new AggregationCursor(new TashmetNamespace('nabu'), this.proxy(), [
      { $documents: patterns.map(p => ({ _id: p })) },
      { $glob: { pattern: '$_id' } },
      ...pipeline
    ]);
  }

  read<TSchema extends Document = Document>(
    ioDescription: IODescription,
    pipeline: Document[] = []
  ): AggregationCursor<TSchema> {
    const io = makeIO(ioDescription);

    const p: Document[] = io instanceof StreamIO
      ? [{ _id: io.path() }, ...pipeline]
      : pipeline;

    return new AggregationCursor(new TashmetNamespace('nabu'), this.proxy(), io.input.concat(...p));
  }

  private async initNamespace(ns: TashmetNamespace) {
    const systemNs = ns.withCollection('system.collections');

    if (!this.store.hasCollection(systemNs)) {
      const coll = this.collectionFactory.createCollection(systemNs, {});
      this.store.addCollection(coll);

      for await (const doc of coll.read()) {
        const { _id, ...options } = doc;
        await this.command(ns, { create: _id, ...options });
      }
    }
  }
}


export class NabuConfigurator extends PluginConfigurator<Nabu> {
  config: NabuConfig = { persistentState: false, io: {}, defaultIO: 'memory', json: {}, yaml: {}, fs: {}, markdown: {} };

  constructor(container: Container, config: Partial<NabuConfig>) {
    super(Nabu, container);
    this.config = {...this.config, ...config};
  }

  io(name: string, config: NabuIOConfig): this {
    this.config.io[name] = config;
    return this;
  }

  register() {
    this.container.register(AggregationEngine);
    this.container.register(QueryPlanner);
    this.container.register(Provider.ofInstance(NabuConfig, this.config));
    this.container.register(MemoryCollectionFactory);
    this.container.register(NabuCollectionFactory);
    this.container.register(Provider.ofResolver(CollectionFactory, Lookup.of(NabuCollectionFactory)));

    if (!this.container.isRegistered(Store)) {
      this.container.register(Store);
    }
  }
}
