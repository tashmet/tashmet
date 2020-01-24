import {Annotation, Newable} from '../reflection';
import {Container} from './interfaces';
import {BasicContainer} from './container';
import {Provider} from './provider';
import {Logger, LogLevel, LoggerConfig} from '../logging/interfaces';
import {DefaultLogger} from '../logging/logger';
import {consoleWriter} from '../logging/console';

export type Bootstrap = (container: Container) => Promise<void>;

export interface BootstrapConfig {
  logLevel?: LogLevel;

  container?: (logger: Logger) => Container;
}

export class BootstrapAnnotation extends Annotation {
  public register<T>(container: Container): Promise<void> {
    throw Error('Bootstrap method not implemented');
  }

  public resolve<T>(container: Container): T {
    throw Error('Bootstrap method not implemented');
  }
}

/**
 * Bootstrap a component with a pre-existing container.
 */
async function bootstrapWithContainer<T>(
  component: Newable<T>, container: Container, loggerConfig: LoggerConfig, fn?: Bootstrap): Promise<T>
{
  container.register(Provider.ofInstance('ziqquratu.Container', container));
  container.register(Provider.ofInstance('ziqquratu.LoggerConfig', loggerConfig));
  container.register(Provider.ofFactory({
    key: 'ziqquratu.Logger',
    inject: ['ziqquratu.LoggerConfig'],
    create: (config: LoggerConfig) => new DefaultLogger(config)
  }));

  if (!BootstrapAnnotation.existsOnClass(component)) {
    throw Error('Missing bootstrap annotation on component');
  }
  const annotation = BootstrapAnnotation.onClass(component)[0];
  await annotation.register(container);
  if (fn) {
    await fn(container);
  }
  return annotation.resolve(container);
}

/**
 * Bootstrap a component.
 */
export async function bootstrap<T>(
  component: Newable<T>, config: BootstrapConfig = {}, fn?: Bootstrap): Promise<T>
{
  const loggerConfig: LoggerConfig = {
    level: config.logLevel !== undefined ? config.logLevel : LogLevel.None,
    sink: consoleWriter(),
  };
  const logger = new DefaultLogger(loggerConfig).inScope('core');
  const container = config.container ? config.container(logger) : new BasicContainer(logger);

  return bootstrapWithContainer(component, container, loggerConfig, fn);
}
