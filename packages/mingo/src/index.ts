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
  DatabaseEngineFactory,
  DatabaseEngine,
} from '@tashmet/tashmet';
import {hashCode, intersection} from 'mingo/util';
import {PrefetchAggregationStrategy} from './aggregator';
import {MingoConfig} from './interfaces';
import {SimpleValidatorFactory} from './validator';
import {MingoDatabaseEngine} from '@tashmet/mingo-engine';

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
export default class MingoDatabaseEngineFactory extends DatabaseEngineFactory {
  private static defaultConfig: MingoConfig = {
    useStrictMode: true,
    scriptEnabled: true,
  };

  public static configure(config: Partial<MingoConfig> = {}) {
    return (container: Container) => {
      container.register(SimpleValidatorFactory);
      container.register(Provider.ofInstance(MingoConfig, {
        ...MingoDatabaseEngineFactory.defaultConfig,
        ...config
      }));
      container.register(MingoDatabaseEngineFactory);
      container.register(Provider.ofResolver(DatabaseEngineFactory, Lookup.of(MingoDatabaseEngineFactory)));
      container.register(Provider.ofInstance(HashCode, hashCode));
      container.register(MingoComparator);
      container.register(PrefetchAggregationStrategy);
    }
  }

  public constructor(
    private logger: Logger,
    private config: MingoConfig,
  ) { super(); }

  public createDatabaseEngine(dbName: string, storageEngine?: StorageEngine): DatabaseEngine {
    return MingoDatabaseEngine.inMemory(dbName);
  }    
}
