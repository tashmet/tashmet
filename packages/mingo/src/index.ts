import {
  Document,
  Container,
  HashCode,
  provider,
  Provider,
  Logger,
} from '@tashmet/tashmet';
import { idSet, ChangeSet, Comparator } from '@tashmet/bridge';
import { AggregatorFactory, AbstractAggregator, ValidatorFactory } from '@tashmet/engine';
import { hashCode, intersection } from 'mingo/util.js';
import { BufferAggregator, PrefetchAggregationStrategy } from './aggregator.js';
import { MingoConfig } from './interfaces.js';
import { Query } from 'mingo';

export * from './interfaces.js';

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

@provider({
  key: AggregatorFactory,
})
export class MingoAggregatorFactory implements AggregatorFactory {
  public constructor(private logger: Logger) {}

  public createAggregator(pipeline: Document[], options: any): AbstractAggregator<Document> {
    return new BufferAggregator(pipeline, options, this.logger);
  }
}

@provider({
  key: ValidatorFactory,
})
export class FilterValidatorFactory extends ValidatorFactory {
  public createValidator(rules: Document) {
    const query = new Query(rules as any);

    return (doc: any) => {
      if (query.test(doc)) {
        return doc;
      } else {
        throw new Error('Document failed validation');
      }
    }
  }
}

@provider()
export default class Mingo {
  private static defaultConfig: MingoConfig = {
    useStrictMode: true,
    scriptEnabled: true,
  };

  public static configure(config: Partial<MingoConfig> = {}) {
    return (container: Container) => {
      container.register(Provider.ofInstance(MingoConfig, {
        ...Mingo.defaultConfig,
        ...config
      }));
      container.register(Provider.ofInstance(HashCode, hashCode));
      container.register(MingoComparator);
      container.register(PrefetchAggregationStrategy);
      container.register(FilterValidatorFactory);
      container.register(MingoAggregatorFactory);
    }
  }
}
