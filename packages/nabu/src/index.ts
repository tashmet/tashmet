import Tashmet, {
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
  AggregationReadController,
  AggregationWriteController,
  QueryPlanner,
  StorageEngine,
  StorageEngineBridge,
  DocumentAccess,
} from '@tashmet/engine';
import {
  FileAccess,
  NabuConfig,
  NabuDatabaseConfig,
} from './interfaces.js';
import { ContentRule } from './content.js';
import { FileStorage } from './storage/fileStorage.js';
import { $objectToJson, $jsonToObject } from './operators/json.js';
import { fs } from './io/fs.js';
import { yaml } from './content/yaml.js';
import { json } from './content/json.js';

export * from './interfaces.js';
export { ContentRule };
export { IO } from './io.js';

import globToRegExp from 'glob-to-regexp';
import { Container, Newable, PluginConfigurator } from '@tashmet/core';


@provider()
export class Nabu {
  public constructor(
    private aggFact: AggregatorFactory,
    private documentAccess: DocumentAccess,
    private tashmet: Tashmet,
    private logger: Logger,
  ) {}

  public createStorageEngine(dbName: string, config: NabuDatabaseConfig): StorageEngine {
    const storage = new FileStorage(dbName, this.tashmet, config);

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
}

export class NabuConfigurator extends PluginConfigurator<Nabu> {
  public constructor(protected app: Newable<any>, container: Container, protected config: NabuConfig) {
    super(app, container);
  }

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

export default {
  engine: (config: NabuConfig) => (container: Container) => new NabuConfigurator(Nabu, container, config),
  fs,
  json,
  yaml,
}
