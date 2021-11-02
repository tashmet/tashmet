import {Container, Logger, Provider} from '@tashmit/core';
import {Database, DatabaseConfig} from './interfaces';
import {DatabaseService} from './database';

export {memory, MemoryCollection, MemoryCollectionConfig} from './collections/memory';
export {withMiddleware} from './collections/managed';
export {applyQueryOptions, sortingMap, AbstractCursor, Selector} from './cursor';
export {aggregate, QueryAggregator} from './aggregation';
export * from './interfaces';
export * from './middleware';

export default class DatabasePlugin {
  public static configure(config: Partial<DatabaseConfig>) {
    const defaultConfig: DatabaseConfig = {
      collections: {},
      operators: {},
    };
    return new DatabasePlugin({...defaultConfig, ...config});
  }

  public constructor(private config: DatabaseConfig) {}

  public register(container: Container) {
    const {collections, use, operators} = this.config;

    container.register(Provider.ofFactory({
      key: Database,
      inject: [Logger.inScope('database.Database')],
      create: (logger: Logger) => {
        const database = new DatabaseService(logger, container, operators, use);
        for (const [name, factOrConfig] of Object.entries(collections)) {
          database.createCollection(name, factOrConfig);
        }
        return database;
      }
    }));
  }
}
