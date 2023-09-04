import { BootstrapConfig, createContainer } from './ioc/bootstrap.js';
import { Container } from './ioc/interfaces.js';
import { Provider } from './ioc/provider.js';
import { LogFormatter, Logger, LoggerConfig, LogLevel } from './logging/interfaces.js';
import { Newable } from './reflection/interfaces.js';

export * from './ioc/index.js';
export * from './logging/index.js';
export * from './reflection/index.js';

export type PluginConfig = (container: Container) => void | (() => void);

export interface Configuration extends LoggerConfig, BootstrapConfig {}

interface Plugin<TConf> {
  configure(conf: TConf): PluginConfig;
}

export abstract class AbstractConfigurator {
  private plugins: PluginConfig[] = [];
  private container: ((logger: Logger) => Container) | undefined = undefined;
  private logLevel: LogLevel = LogLevel.None;
  private logFormat: LogFormatter | undefined = undefined;

  public constructor(
    private providers: (Provider<any> | Newable<any>)[] = [],
    config: Partial<Configuration>,
  ) {
    this.container = config.container;
    this.logLevel = config.logLevel || LogLevel.None;
    this.logFormat = config.logFormat;
  }

  public provide(...providers: (Provider<any> | Newable<any>)[]) {
    this.providers.push(...providers);
    return this;
  }

  public use<TConf>(ctr: Plugin<TConf>, conf: TConf) {
    this.plugins.push(ctr.configure(conf));
    return this;
  }

  protected async bootstrap<T>(app: Newable<T>): Promise<T> {
    const container = createContainer({
      logFormat: this.logFormat,
      logLevel: this.logLevel,
      container: this.container,
    });

    for (const provider of this.providers) {
      container.register(provider);
    }

    const loaders = this.plugins.map(p => p(container));

    if (!container.isRegistered(app)) {
      container.register(app);
    }

    for (const loader of loaders) {
      if (typeof loader === 'function') {
        loader();
      }
    }

    return container.resolve(app);
  }
}