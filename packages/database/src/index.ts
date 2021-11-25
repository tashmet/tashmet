import {Container, Logger, Plugin, Provider} from '@tashmit/core';
import {Database, DatabaseConfig, ValidatorFactory} from './interfaces';
import {DatabaseService} from './database';
import {SimpleValidatorFactory} from './validator';

export {Collection} from './collection';
export {memory, MemoryCollectionConfig} from './collections/memory';
export {withMiddleware} from './middleware';
export {applyQueryOptions, sortingMap, AbstractCursor, Selector} from './cursor';
export {aggregate, QueryAggregator} from './aggregation';
export {filterValidator} from './validator';
export * from './interfaces';
export * from './middleware';
export * from './util';

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

    container.register(SimpleValidatorFactory);

    container.register(Provider.ofFactory({
      key: Database,
      inject: [
        Logger.inScope('database.Database'),
        ValidatorFactory,
      ],
      create: (logger: Logger, validatorFactory: ValidatorFactory) =>
        new DatabaseService(logger, container, validatorFactory, operators, use)
    }));
  }

  public setup(container: Container) {
    const database = container.resolve(Database)
    for (const [name, source] of Object.entries(this.config.collections)) {
      database.createCollection(name, source);
    }
  }
}
