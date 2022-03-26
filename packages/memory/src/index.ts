import {Container, Logger, Lookup, provider, Provider} from '@tashmet/core';
import {Document, StorageEngine, StoreConfig, ViewFactory, HashCode, Comparator, ChangeSet, idSet} from '@tashmet/database';
import {OperatorType, useOperators} from 'mingo/core';
import {hashCode, intersection} from 'mingo/util';
import {MemoryClientConfig} from './interfaces';
import {MemoryStore} from './store';
import {SimpleValidatorFactory} from './validator';
import {MemoryViewFactory} from './view';

export {filterValidator} from './validator';
export * from './interfaces';

@provider({key: Comparator})
export class MemoryComparator implements Comparator {
  public difference<TSchema extends Document>(a: TSchema[], b: TSchema[]): ChangeSet<TSchema> {
    const unchangedIds = idSet(intersection(a, b));

    return new ChangeSet(
      b.filter(doc => !unchangedIds.has(doc._id)),
      a.filter(doc => !unchangedIds.has(doc._id)),
    );
  }
}


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
      container.register(Provider.ofInstance(HashCode, hashCode));
      container.register(MemoryComparator);

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
