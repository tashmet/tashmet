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
  MemoryStorageEngine,
  StoreConfig,
  ViewFactory,
} from '@tashmet/tashmet';
import {hashCode, intersection} from 'mingo/util';
import {/*MingoAggregator,*/ PrefetchAggregationStrategy} from './aggregator';
import {MingoConfig} from './interfaces';
import {MingoStore} from './store';
import {SimpleValidatorFactory} from './validator';
import {MingoViewFactory} from './view';

export {filterValidator} from './validator';
export * from './interfaces';

@provider({key: Comparator})
export class MingoComparator implements Comparator {
  public difference<TSchema extends Document>(a: TSchema[], b: TSchema[]): ChangeSet<TSchema> {
    const unchangedIds = idSet(intersection([a, b]));

    return new ChangeSet(
      b.filter(doc => !unchangedIds.has(doc._id)),
      a.filter(doc => !unchangedIds.has(doc._id)),
    );
  }
}

@provider()
export default class MingoStorageEngine extends StorageEngine {
  private static defaultConfig: MingoConfig = {
    useStrictMode: true,
    scriptEnabled: true,
  };

  public static configure(config: Partial<MingoConfig> = {}) {
    return (container: Container) => {
      container.register(SimpleValidatorFactory);
      container.register(Provider.ofInstance(MingoConfig, {
        ...MingoStorageEngine.defaultConfig,
        ...config
      }));
      container.register(MingoStorageEngine);
      container.register(Provider.ofResolver(MemoryStorageEngine, Lookup.of(MingoStorageEngine)));
      container.register(Provider.ofResolver(StorageEngine, Lookup.of(MingoStorageEngine)));
      container.register(MingoViewFactory);
      container.register(Provider.ofResolver(ViewFactory, Lookup.of(MingoViewFactory)));
      container.register(Provider.ofInstance(HashCode, hashCode));
      container.register(MingoComparator);
      // container.register(MingoAggregator);
      container.register(PrefetchAggregationStrategy);
    }
  }

  public constructor(
    private logger: Logger,
    private config: MingoConfig,
  ) { super(); }

  public createStore<TSchema extends Document>(config: StoreConfig) {
    return MingoStore.fromConfig<TSchema>({...this.config, ...config});
  }
}
