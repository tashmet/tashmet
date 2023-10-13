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

export type Plugin<T> = (container: Container) => PluginConfigurator<T>;

export function createApp<T>(plugin: Plugin<T>, config?: BootstrapConfig): PluginConfigurator<T> {
  return plugin(createContainer(config || { logLevel: LogLevel.None }));
}

export class PluginConfigurator<T> {
  protected plugins: PluginConfigurator<any>[] = [];

  public constructor(protected app: Newable<T>, protected container: Container) {
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

  public use(plugin: (container: Container) => PluginConfigurator<any>) {
    this.plugins.push(plugin(this.container));
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
