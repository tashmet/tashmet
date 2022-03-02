import {Container, Logger, provider, Provider} from '@tashmit/core';
import {Database, MemoryClientConfig, ValidatorFactory, Client} from './interfaces';
import {MemoryDatabase} from './database';
import {SimpleValidatorFactory} from './validator';

export {MemoryDatabase};
export {Collection} from './collection';
export {MemoryDriver, MemoryCollectionConfig} from './collections/memory';
export {withMiddleware} from './middleware';
export {applyQueryOptions, sortingMap, AbstractCursor} from './cursor';
export {QueryAggregator} from './aggregation';
export {filterValidator} from './validator';
export * from './changeStream';
export * from './interfaces';
export * from './middleware';
export * from './changeSet';


@provider({
  key: MemoryClient,
  inject: [Logger, ValidatorFactory, 'tashmit.MemoryClientConfig']
})
export default class MemoryClient extends Client<Database> {
  private static defaultConfig: MemoryClientConfig = {
    operators: {},
  };

  public static configure(config: Partial<MemoryClientConfig> = {}) {
    return (container: Container) => {
      container.register(SimpleValidatorFactory);
      container.register(Provider.ofInstance('tashmit.MemoryClientConfig', {
        ...MemoryClient.defaultConfig,
        ...config
      }));
      container.register(MemoryClient);
    }
  }

  public constructor(
    private logger: Logger,
    private validatorFactory: ValidatorFactory,
    private config: MemoryClientConfig,
  ) { super(); }

  public db(name: string) {
    return new MemoryDatabase(
      name,
      this.logger,
      this.validatorFactory,
      this.config.operators,
    );
  }
}
