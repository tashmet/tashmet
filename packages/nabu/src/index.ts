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
  FileAccess,
  NabuConfig,
  NabuDatabaseConfig,
  StreamProvider
} from './interfaces.js';
import { ContentRule } from './content.js';
import { Stream } from './stream.js';
import { FileStorage } from './storage/fileStorage.js';
import { $objectToJson, $jsonToObject } from './operators/json.js';

export * from './interfaces.js';
export { ContentRule };

import globToRegExp from 'glob-to-regexp';
import { BootstrapConfig, Container, plugin, PluginConfigurator } from '@tashmet/core';

export interface YamlContentRule {
  frontMatter?: boolean;

  contentKey?: string;

  merge?: Document;

  construct?: Document;
}

export interface JsonContentRule {
  merge?: Document;

  construct?: Document;
}


@provider()
@plugin<Partial<NabuConfig>>()
export default class Nabu implements StreamProvider {
  public static configure(config: Partial<BootstrapConfig> & Partial<NabuConfig>, container?: Container) {
    return new NabuConfigurator(Nabu, config, container);
  }

  public static json(config: JsonContentRule): ContentRule {
    const def: Required<JsonContentRule> = {
      merge: { _id: '$path' },
      construct: {},
    }
    const { merge, construct } = { ...def, ...config };

    return ContentRule
      .fromRootReplace({ $jsonToObject: '$content' }, { $objectToJson: '$content' }, merge)
      .assign(construct);
  }

  public static yaml(config: YamlContentRule): ContentRule {
    const def: Required<YamlContentRule> = {
      frontMatter: false,
      contentKey: '_content',
      merge: { _id: '$path' },
      construct: {},
    }
    const { frontMatter, contentKey, merge, construct } = { ...def, ...config };

    const input = frontMatter ? { $yamlfmParse: '$content' } : { $yamlToObject: '$content' };
    const output = frontMatter ? { $yamlfmDump: '$content' } : { $objectToYaml: '$content' };

    return ContentRule
      .fromRootReplace(input, output, merge)
      .rename('_content', contentKey)
      .assign(construct);
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

  public createStorageEngine(dbName: string, config: NabuDatabaseConfig): StorageEngine {
    const storage = new FileStorage(dbName, this, config);

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
    this.container.register(FileAccess);

    if (!this.container.isRegistered(DocumentAccess)) {
      this.container.register(DocumentAccess);
    }
    if (!this.container.isRegistered(Dispatcher)) {
      this.container.register(Dispatcher);
    }
  }

  public load() {
    const aggFact = this.container.resolve(AggregatorFactory);
    const nabu = this.container.resolve(Nabu);
    const dispatcher = this.container.resolve(Dispatcher);

    aggFact.addExpressionOperator('$objectToJson', $objectToJson);
    aggFact.addExpressionOperator('$jsonToObject', $jsonToObject);
    aggFact.addExpressionOperator('$globMatch', (args, resolve) => {
      return globToRegExp(args.glob, {extended: true}).test(resolve(args.input));
    });

    for (const [dbName, dbConfig] of Object.entries(this.config.databases || {})) {
      dispatcher.addBridge(dbName, new StorageEngineBridge(db => nabu.createStorageEngine(db, dbConfig)));
    }
  }
}
