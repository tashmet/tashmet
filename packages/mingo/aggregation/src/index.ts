import {
  Container,
  HashCode,
  provider,
  Provider,
} from '@tashmet/tashmet';
import { hashCode } from 'mingo/util';
import { MingoConfig, MingoAggregatorFactory } from '@tashmet/mingo';
import 'mingo/init/system';

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
      container.register(MingoAggregatorFactory);
    }
  }
}
