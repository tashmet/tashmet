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
  DocumentAccess,
} from '@tashmet/engine';
import {
  ContentRule,
  FileAccess,
  NabuConfig,
  NabuDatabaseConfig,
  StreamProvider
} from './interfaces.js';
import { Stream } from './stream.js';
import { FileStorage } from './storage/fileStorage.js';
import { $jsonDump, $jsonParse } from './operators/json.js';

export * from './interfaces.js';

import globToRegExp from 'glob-to-regexp';
import { BootstrapConfig, Container, plugin, PluginConfigurator } from '@tashmet/core';
import * as nodePath from 'path';

@provider()
export class NabuContentRules {
  private rules: Record<string, ContentRule> = {}

  public get readPipeline(): Document[] {
    const branches = Object.entries(this.rules).map(([glob, rule]) => {
      return { case: {$globMatch: { input: '$path', glob } }, then: rule.parse };
    });

    return [
      { $set: { content: { $switch: { branches, default: { text: '$content' } } } } },
      { $set: { 'content._id': { $basename: ['$path', { $extname: '$path' } ] } } },
    ];
  }

  public get writePipeline(): Document[] {
    const branches = Object.entries(this.rules).map(([glob, rule]) => {
      return { case: {$globMatch: { input: '$path', glob } }, then: rule.serialize };
    });

    return [
      //{ $unset: 'content._id' },
      { $set: { content: { $switch: { branches, default: { text: '$content' } } } } },
    ];
  }

  public rule(glob: string, rule: ContentRule) {
    this.rules[glob] = rule;
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
    private contentRules: NabuContentRules,
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

    const stream = new Stream(src, this.fileAccess, this.aggFact);

    if (options && options.content) {
      return stream.pipe(this.contentRules.readPipeline);
    }
    return stream;
  }

  public generate(docs: Document[]): Stream {
    return Stream.fromArray(docs, this.fileAccess, this.aggFact);
  }

  public createStorageEngine(dbName: string, config: NabuDatabaseConfig): StorageEngine {
    const storage = new FileStorage(dbName, this, config, this.contentRules);

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
    this.container.register(NabuContentRules);
    this.container.register(FileAccess);

    if (!this.container.isRegistered(DocumentAccess)) {
      this.container.register(DocumentAccess);
    }
  }

  public load() {
    const contentRules = this.container.resolve(NabuContentRules);
    const aggFact = this.container.resolve(AggregatorFactory);
    const nabu = this.container.resolve(Nabu);
    const dispatcher = this.container.resolve(Dispatcher);

    contentRules.rule('*.json', {
      parse: { $jsonParse: '$content' },
      serialize: { $jsonDump: '$content' }
    });

    aggFact.addExpressionOperator('$jsonDump', $jsonDump);
    aggFact.addExpressionOperator('$jsonParse', $jsonParse);
    aggFact.addExpressionOperator('$basename', (args, resolve) => {
      if (Array.isArray(args)) {
        return nodePath.basename(resolve(args[0]), resolve(args[1]));
      }
      return nodePath.basename(resolve(args));
    });
    aggFact.addExpressionOperator('$extname', (args, resolve) => {
      return nodePath.extname(resolve(args));
    });
    aggFact.addExpressionOperator('$globMatch', (args, resolve) => {
      return globToRegExp(args.glob, {extended: true}).test(resolve(args.input));
    });

    for (const [dbName, dbConfig] of Object.entries(this.config.databases || {})) {
      dispatcher.addBridge(dbName, new StorageEngineBridge(db => nabu.createStorageEngine(db, dbConfig)));
    }
  }
}
