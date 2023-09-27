import {
  AbstractCursor,
  Collection,
  Document,
  Logger,
  provider,
} from '@tashmet/tashmet';
import { Dispatcher } from '@tashmet/bridge';
import {
  AggregatorFactory,
  AggregationEngine,
  ViewMap,
  AdminController,
  AggregationController,
  QueryPlanner,
  StorageEngine,
  StorageEngineBridge,
  Writable,
  Streamable,
  CollectionRegistry,
  DocumentAccess,
} from '@tashmet/engine';
import {
  CollectionBundleConfig,
  ContentReader,
  ContentReaderFunction,
  ContentWriter,
  ContentWriterFunction,
  DocumentBundleConfig,
  File,
  FileAccess,
  NabuConfig,
  NabuDatabaseConfig,
  StreamProvider
} from './interfaces.js';
import { Stream } from './stream.js';
import { DocumentBundleStorage } from './storage/documentBundle.js';
import { CollectionBundleStorage } from './storage/collectionBundle.js';
import { textWriter } from './operators/text.js';
import { $jsonDump, $jsonParse, jsonReader, jsonWriter } from './operators/json.js';

export * from './interfaces.js';

import globToRegExp from 'glob-to-regexp';
import { BootstrapConfig, Container, plugin, PluginConfigurator } from '@tashmet/core';

@provider({
  key: ContentReader,
  inject: [Logger.inScope('nabu.NabuContentReader')],
})
export class NabuContentReader implements ContentReader {
  private patterns: string[] = [];
  private readers: ContentReaderFunction[] = [];

  public constructor(private logger: Logger) {}

  public async read(file: File<any>): Promise<File<any>> {
    for (let i=0; i<this.patterns.length; i++) {
      if (globToRegExp(this.patterns[i], {extended: true}).test(file.path)) {
        this.logger.info(`reading '${file.path}' matching '${this.patterns[i]}'`);
        return {...file, content: await this.readers[i](file.content)};
      }
    }
    throw new Error('No matching content reader found');
  }

  public register(pattern: string, reader: (content: any) => Promise<any>) {
    this.patterns.push(pattern);
    this.readers.push(reader);
  }
}

@provider({
  key: ContentWriter,
  inject: [Logger.inScope('nabu.NabuContentWriter')]
})
export class NabuContentWriter implements ContentWriter {
  private patterns: string[] = [];
  private writers: ContentWriterFunction[] = [];

  public constructor(private logger: Logger) {}

  public async write(file: File<any>): Promise<File<any>> {
    this.logger.info(`writing '${file.path}'`);

    if (file.content === undefined) {
      return file;
    }
    for (let i=0; i<this.patterns.length; i++) {
      if (globToRegExp(this.patterns[i], {extended: true}).test(file.path)) {
        return {...file, content: await this.writers[i](file.content)};
      }
    }
    if (typeof file.content === 'string') {
      return {...file, content: await textWriter(file.content) };
    }
    throw new Error('No matching content writer found');
  }

  public register(pattern: string, writer: (content: any) => Promise<any>) {
    this.patterns.push(pattern);
    this.writers.push(writer);
  }
}

@provider()
@plugin<Partial<NabuConfig>>()
export default class Nabu implements StreamProvider {
  public static configure(config: Partial<BootstrapConfig> & Partial<NabuConfig>, container?: Container) {
    return new NabuConfigurator(Nabu, config, container);
  }

  public constructor(
    private aggFact: AggregatorFactory,
    private documentAccess: DocumentAccess,
    private fileAccess: FileAccess,
    private logger: Logger,
  ) {}

  public source(
    src: string | Document[] | AsyncIterable<Document> | AbstractCursor<Document> | Collection<Document>,
    options?: Document
  ): Stream {
    if (typeof src === "string") {
      return new Stream(this.fileAccess.read(src, options), this.fileAccess, this.aggFact);
    }

    if (Array.isArray(src)) {
      return Stream.fromArray(src, this.fileAccess, this.aggFact);
    }

    if (src instanceof Collection) {
      return new Stream(src.aggregate([]), this.fileAccess, this.aggFact);
    }

    return new Stream(src, this.fileAccess, this.aggFact);
  }

  public generate(docs: Document[]): Stream {
    return Stream.fromArray(docs, this.fileAccess, this.aggFact);
  }

  public createBuffer(dbName: string, config: NabuDatabaseConfig): StorageEngine {
    let storage: Streamable & Writable & CollectionRegistry;

    if (config.hasOwnProperty('documentBundle')) {
      storage = new DocumentBundleStorage(dbName, this, config as DocumentBundleConfig);
    } else {
      storage = new CollectionBundleStorage(dbName, this, config as CollectionBundleConfig);
    }

    const engine = new AggregationEngine(
      this.aggFact, new QueryPlanner(this.documentAccess, this.logger.inScope('QueryPlanner')), dbName);
    const views: ViewMap = {};
    this.documentAccess.addStreamable(dbName, storage);
    this.documentAccess.addWritable(dbName, storage);
    return StorageEngine.fromControllers(dbName,
      new AdminController(dbName, storage, views),
      new AggregationController(dbName, storage, engine, views)
    );
  }
}

export class NabuConfigurator extends PluginConfigurator<Nabu, Partial<NabuConfig>> {
  public register() {
    this.container.register(NabuContentReader);
    this.container.register(NabuContentWriter);
    this.container.register(FileAccess);

    if (!this.container.isRegistered(DocumentAccess)) {
      this.container.register(DocumentAccess);
    }
  }

  public load() {
    const cr = this.container.resolve(ContentReader);
    const cw = this.container.resolve(ContentWriter);
    const aggFact = this.container.resolve(AggregatorFactory);
    const nabu = this.container.resolve(Nabu);
    const dispatcher = this.container.resolve(Dispatcher);

    //cr.register('text', textReader);
    cr.register('*.json', content => jsonReader(content));
    cw.register('*.json', content => jsonWriter(content));

    aggFact.addExpressionOperator('$jsonDump', $jsonDump);
    aggFact.addExpressionOperator('$jsonParse', $jsonParse);

    for (const [dbName, dbConfig] of Object.entries(this.config.databases || {})) {
      dispatcher.addBridge(dbName, new StorageEngineBridge(db => nabu.createBuffer(db, dbConfig)));
    }
  }
}
