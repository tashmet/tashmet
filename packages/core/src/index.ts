import { BootstrapConfig, createContainer } from './ioc/bootstrap.js';
import { Container } from './ioc/interfaces.js';
import { Provider } from './ioc/provider.js';
import { LogLevel } from './logging/interfaces.js';
import { Newable } from './reflection/interfaces.js';

export * from './ioc/index.js';
export * from './logging/index.js';
export * from './reflection/index.js';

export type PluginConfig = (container: Container) => void | (() => void);
export type StaticThis<T> = { new (...args: any[]): T };

export interface Plugin<TConfig> {
  configure(config: Partial<BootstrapConfig> & TConfig): PluginConfigurator<any, TConfig>

  configure(config: TConfig, container?: Container): PluginConfigurator<any, TConfig>;
}

export function plugin<TConfig>() {
  return <U extends Plugin<TConfig>>(constructor: U) => {constructor};
}

//export type PluginLoader = (() => void) | void;
//export type PluginSetup<T> = (container: Container, config: T, standalone: boolean) => PluginLoader;

export class PluginConfigurator<T, TConfig> {
  protected plugins: PluginConfigurator<any, any>[] = [];
  protected container: Container;

  public constructor(protected app: Newable<T>, protected config: Partial<BootstrapConfig> & TConfig, container?: Container) {
    if (!container) {
      this.container = createContainer({
        logLevel: config.logLevel === undefined ? LogLevel.None : config.logLevel,
        logFormat: config.logFormat,
        container: config.container });
    } else {
      this.container = container;
    }
    this.container.register(app);
    this.register();
  }

  public register(): void {}

  public load(): void {};

  public provide(...providers: (Provider<any> | Newable<any>)[]) {
    for (const provider of providers) {
      this.container.register(provider);
    }
    return this;
  }

  public use<TConf>(plugin: Plugin<TConf>, config: TConf) {
    this.plugins.push(plugin.configure(config, this.container));
    return this;
  }

  public bootstrap(): T {
    for (const plugin of this.plugins) {
      plugin.register();
    }

    for (const plugin of this.plugins) {
      plugin.load();
    }

    this.load();

    return this.container.resolve(this.app);
  }
}
