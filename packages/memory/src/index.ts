import {
  Document,
  ChangeSet,
  Comparator,
  Container,
  idSet,
  HashCode,
  Logger,
  Lookup,
  provider,
  Provider,
  StorageEngine,
  StoreConfig,
  ViewFactory,
} from '@tashmet/tashmet';
import {hashCode, intersection} from 'mingo/util';
import {MemoryAggregator, PrefetchAggregationStrategy} from './aggregator';
import {MemoryClientConfig} from './interfaces';
import {MemoryStore} from './store';
import {SimpleValidatorFactory} from './validator';
import {MemoryViewFactory} from './view';

export {filterValidator} from './validator';
export * from './interfaces';

@provider({key: Comparator})
export class MemoryComparator implements Comparator {
  public difference<TSchema extends Document>(a: TSchema[], b: TSchema[]): ChangeSet<TSchema> {
    const unchangedIds = idSet(intersection([a, b]));

    return new ChangeSet(
      b.filter(doc => !unchangedIds.has(doc._id)),
      a.filter(doc => !unchangedIds.has(doc._id)),
    );
  }
}

@provider()
export default class MemoryStorageEngine extends StorageEngine {
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
      container.register(MemoryAggregator);
      container.register(PrefetchAggregationStrategy);
    }
  }

  public constructor(
    private logger: Logger,
    private config: MemoryClientConfig,
  ) { super(); }

  public createStore<TSchema extends Document>(config: StoreConfig) {
    return MemoryStore.fromConfig<TSchema>(config);
  }
}
