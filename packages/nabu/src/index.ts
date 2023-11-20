import {
  BootstrapConfig,
  Container,
  createContainer,
  LogLevel,
  Lookup,
  Optional,
  PluginConfigurator,
  Provider,
  provider
} from '@tashmet/core';
import {
  AggregationCursor,
  Document,
  TashmetCollectionNamespace,
  CreateCollectionOptions,
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
  ReadWriteCollection,
  CommandRunner,
  AggregatorFactory,
  ValidatorFactory,
  Validator,
} from '@tashmet/engine';
import Json from '@tashmet/json';
import Yaml from '@tashmet/yaml';
import Fs from '@tashmet/fs';
import Markdown from '@tashmet/markdown';
import { MemoryCollectionFactory } from '@tashmet/memory';
import {
  NabuConfig,
  NabuIOConfig,
  BufferIO,
  StreamIO,
} from './interfaces.js';
import { StreamCollection } from './storage/streamCollection.js';
import { YamlContentRule, YamlIORule } from './io/yaml.js';
import { JsonIORule } from './io/json.js';
import { BufferCollection } from './storage/bufferCollection.js';

export * from './interfaces.js';

@provider()
export default class Nabu extends StorageEngine {
  static json() {
    return new JsonIORule();
  }

  static yaml(config: YamlContentRule = {}) {
    return new YamlIORule(config);
  }

  private commandRunner: CommandRunner;

  constructor(
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
  command(ns: TashmetNamespace, command: Document): Promise<Document> {
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
    io: BufferIO | StreamIO,
    pipeline: Document[] = []
  ): AggregationCursor<TSchema> {
    const p: Document[] = io instanceof StreamIO
      ? [{ _id: io.path() }, ...pipeline]
      : pipeline;

    return new AggregationCursor(new TashmetNamespace('nabu'), this.proxy(), io.input.concat(...p));
  }

  /**
   * Create an aggregation cursor based on reading JSON files
   * 
   * @param pattern A glob pattern
   * @param pipeline An optional aggregation pipeline
   * @returns An aggregation cursor
   */
  json<TSchema extends Document>(
    pattern: string, pipeline: Document[] = []
  ): AggregationCursor<TSchema> {
    return this.read(Nabu.json().glob(pattern), pipeline);
  }

  /**
   * Create an aggregation cursor based on reading YAML files
   * 
   * @param pattern A glob pattern
   * @param pipeline An optional aggregation pipeline
   * @returns An aggregation cursor
   */
  yaml<TSchema extends Document>(
    pattern: string, options?: YamlContentRule, pipeline: Document[] = []
  ): AggregationCursor<TSchema> {
    return this.read(Nabu.yaml(options).glob(pattern), pipeline);
  }
}

@provider({
  inject: [
    MemoryCollectionFactory,
    NabuConfig,
    AggregatorFactory,
    Optional.of(ValidatorFactory)
  ]
})
export class NabuCollectionFactory extends CollectionFactory {
  public constructor(
    private memory: MemoryCollectionFactory,
    private config: NabuConfig,
    private aggregatorFactory: AggregatorFactory,
    private validatorFactory: ValidatorFactory | undefined,
  ) { super(); }

  createCollection(ns: TashmetCollectionNamespace, options: CreateCollectionOptions): ReadWriteCollection {
    const mergedOptions = {...options, storageEngine: options.storageEngine || { io: this.config.defaultIO } };

    if (mergedOptions.storageEngine.io === 'memory') {
      return this.memory.createCollection(ns, mergedOptions);
    }

    const ioName = mergedOptions.storageEngine?.io;
    const io = this.config.io[ioName](ns, mergedOptions.storageEngine || {});
    let validator: Validator | undefined;

    if (this.validatorFactory && options.validator) {
      validator = this.validatorFactory.createValidator(options.validator);
    }
    
    const input = this.aggregatorFactory.createAggregator(io.input);
    const output = this.aggregatorFactory.createAggregator(io.output);

    if (io instanceof StreamIO) {
      return new StreamCollection(ns, io.path, input, output, validator);
    }

    if (io instanceof BufferIO) {
      const buffer = this.memory.createCollection(ns, mergedOptions);

      return new BufferCollection(ns, io.path, input, output, buffer);
    }

    throw Error('Unsupported IO');
  }
}


export class NabuConfigurator extends PluginConfigurator<Nabu> {
  config: NabuConfig = { io: {}, defaultIO: 'memory', json: {}, yaml: {}, fs: {}, markdown: {} };

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
