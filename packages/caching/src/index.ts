import {Container, Plugin, Provider} from '@tashmit/core';
import {CachingConfig} from './interfaces';
import {CachingLayerService} from './middleware';

export {CachingConfig};

export default class CachingPlugin extends Plugin {
  public constructor(private config: CachingConfig) {
    super();
  }

  public register(container: Container) {
    container.register(Provider.ofInstance(CachingConfig, this.config));
    container.register(CachingLayerService);
  }
}
