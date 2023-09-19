import {
  Document,
  HashCode,
  provider,
  Provider,
  Logger,
} from '@tashmet/tashmet';
import { idSet, ChangeSet, Comparator } from '@tashmet/bridge';
import { AggregatorFactory, AbstractAggregator, ValidatorFactory, DocumentAccess } from '@tashmet/engine';
import { hashCode, intersection } from 'mingo/util.js';
import { BufferAggregator } from './aggregator.js';
import { MingoConfig } from './interfaces.js';
import { Query } from 'mingo';
import { BootstrapConfig, Container, plugin, PluginConfigurator } from '@tashmet/core';

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
@plugin<Partial<MingoConfig>>()
export default class MingoAggregatorFactory implements AggregatorFactory {
  public constructor(
    private documentAccess: DocumentAccess,
    private logger: Logger
  ) {}

  public static configure(config: Partial<BootstrapConfig> & Partial<MingoConfig>, container?: Container) {
    return new MingoConfigurator(MingoAggregatorFactory, config, container);
  }

  public createAggregator(pipeline: Document[], options: any): AbstractAggregator<Document> {
    return new BufferAggregator(pipeline, this.documentAccess, options, this.logger);
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

export class MingoConfigurator extends PluginConfigurator<AggregatorFactory, Partial<MingoConfig>> {
  public register() {
    const defaultConfig: MingoConfig = {
      useStrictMode: true,
      scriptEnabled: true,
    };

    this.container.register(Provider.ofInstance(MingoConfig, { ...defaultConfig, ...this.config }));
    this.container.register(Provider.ofInstance(HashCode, hashCode));
    this.container.register(MingoComparator);
    this.container.register(FilterValidatorFactory);
  }
}
