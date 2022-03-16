import {Container, Logger, Lookup, provider, Provider} from '@tashmit/core';
import {Document, StorageEngine, StoreConfig, ViewFactory} from '@tashmit/database';
import { OperatorType, useOperators } from 'mingo/core';
import {MemoryClientConfig} from './interfaces';
import {MemoryStore} from './store';
import {SimpleValidatorFactory} from './validator';
import { MemoryViewFactory } from './view';

export {filterValidator} from './validator';
export * from './interfaces';


@provider()
export default class MemoryStorageEngine implements StorageEngine {
  private static defaultConfig: MemoryClientConfig = {
    operators: {},
  };

  public static configure(config: Partial<MemoryClientConfig> = {}) {
    return (container: Container) => {
      container.register(SimpleValidatorFactory);
      container.register(Provider.ofInstance(MemoryClientConfig, {
        ...MemoryStorageEngine.defaultConfig,
        ...config
      }));
      container.register(MemoryStorageEngine);
      container.register(Provider.ofResolver(StorageEngine, Lookup.of(MemoryStorageEngine)));
      container.register(MemoryViewFactory);
      container.register(Provider.ofResolver(ViewFactory, Lookup.of(MemoryViewFactory)));

      const {accumulator, expression, pipeline, projection, query} = config.operators || {};

      useOperators(OperatorType.ACCUMULATOR, accumulator || {});
      useOperators(OperatorType.EXPRESSION, expression || {});
      useOperators(OperatorType.PIPELINE, pipeline || {});
      useOperators(OperatorType.PROJECTION, projection || {});
      useOperators(OperatorType.QUERY, query || {});
    }
  }

  public constructor(
    private logger: Logger,
    private config: MemoryClientConfig,
  ) {}

  public createStore<TSchema extends Document>(config: StoreConfig) {
    return MemoryStore.fromConfig<TSchema>(config);
  }
}
