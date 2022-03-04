import {Container, Logger, provider, Provider} from '@tashmit/core';
import {Client, ValidatorFactory} from '@tashmit/database';
import {MemoryClientConfig} from './interfaces';
import {MemoryDatabase} from './database';
import {SimpleValidatorFactory} from './validator';

export {MemoryDatabase};
export {MemoryDriver, MemoryCreateCollectionOptions} from './driver';
export {filterValidator} from './validator';
export * from './interfaces';


@provider({
  key: MemoryClient,
  inject: [Logger, ValidatorFactory, MemoryClientConfig]
})
export default class MemoryClient extends Client<MemoryDatabase> {
  private static defaultConfig: MemoryClientConfig = {
    operators: {},
  };

  public static configure(config: Partial<MemoryClientConfig> = {}) {
    return (container: Container) => {
      container.register(SimpleValidatorFactory);
      container.register(Provider.ofInstance(MemoryClientConfig, {
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
