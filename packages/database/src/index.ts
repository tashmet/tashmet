import {Container, Logger, Plugin, Provider} from '@tashmit/core';
import {Database, DatabaseConfig} from './interfaces';
import {DatabaseService} from './database';

export {memory, MemoryCollection, MemoryCollectionConfig} from './collections/memory';
export {withMiddleware} from './collections/managed';
export {applyQueryOptions, sortingMap, AbstractCursor, Selector} from './cursor';
export {aggregate, QueryAggregator} from './aggregation';
export * from './interfaces';
export * from './middleware';

export default class DatabasePlugin extends Plugin {
  private static defaultConfig: DatabaseConfig = {
    operators: {},
    collections: {},
  };

  private config: DatabaseConfig;

  public constructor(config: Partial<DatabaseConfig> = {}) {
    super();
    this.config = {...DatabasePlugin.defaultConfig, ...config};
  }

  public register(container: Container) {
    const {use, operators} = this.config;

    container.register(Provider.ofFactory({
      key: Database,
      inject: [Logger.inScope('database.Database')],
      create: (logger: Logger) =>
        new DatabaseService(logger, container, operators, use)
    }));
  }

  public setup(container: Container) {
    const database = container.resolve(Database)
    for (const [name, source] of Object.entries(this.config.collections)) {
      database.createCollection(name, source);
    }
  }
}
