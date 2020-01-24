import {Annotation, Newable} from '../reflection';
import {Container} from './interfaces';
import {BasicContainer} from './container';
import {Provider} from './provider';
import {Logger, LogLevel, LoggerConfig, LogFormatter} from '../logging/interfaces';
import {DefaultLogger} from '../logging/logger';
import {consoleWriter} from '../logging/console';

export type Bootstrap = (container: Container) => Promise<void>;

export interface BootstrapConfig {
  logLevel?: LogLevel;

  logFormat?: LogFormatter;

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
 * Bootstrap a component.
 */
export async function bootstrap<T>(
  component: Newable<T>, config: BootstrapConfig = {}, fn?: Bootstrap): Promise<T>
{
  const loggerConfig: LoggerConfig = {
    level: config.logLevel !== undefined ? config.logLevel : LogLevel.None,
    sink: consoleWriter({format: config.logFormat}),
  };
  const logger = DefaultLogger.fromConfig(loggerConfig).inScope('core');
  const container = config.container ? config.container(logger) : new BasicContainer(logger);

  logger.debug(`Bootstrapping '${component.name}'`);

  container.register(Provider.ofInstance('ziqquratu.Container', container));
  container.register(Provider.ofInstance('ziqquratu.LoggerConfig', loggerConfig));
  container.register(Provider.ofFactory({
    key: 'ziqquratu.Logger',
    inject: ['ziqquratu.LoggerConfig'],
    create: (config: LoggerConfig) => DefaultLogger.fromConfig(config)
  }));

  if (!BootstrapAnnotation.existsOnClass(component)) {
    throw Error('Missing bootstrap annotation on component');
  }
  const annotation = BootstrapAnnotation.onClass(component)[0];
  await annotation.register(container);
  if (fn) {
    logger.debug('Running custom bootstrap function');
    await fn(container);
  }
  return annotation.resolve(container);
}
