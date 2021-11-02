import {Container} from './interfaces';
import {BasicContainer} from './container';
import {Provider} from './provider';
import {Logger, LogLevel, LoggerConfig, LogFormatter} from '../logging/interfaces';
import {DefaultLogger} from '../logging/logger';
import {consoleWriter} from '../logging/console';

export interface BootstrapConfig {
  logLevel: LogLevel;

  logFormat?: LogFormatter;

  container?: (logger: Logger) => Container;
}

/**
 * Create a container
 */
export function createContainer(config: BootstrapConfig): Container {
  const loggerConfig: LoggerConfig = {
    level: config.logLevel,
    sink: consoleWriter({format: config.logFormat}),
  };
  const logger = DefaultLogger.fromConfig(loggerConfig);
  const container = config.container
    ? config.container(logger)
    : new BasicContainer(logger);

  container.register(Provider.ofInstance(Container, container));
  container.register(Provider.ofInstance('tashmit.LoggerConfig', loggerConfig));
  container.register(Provider.ofFactory({
    key: Logger,
    inject: ['tashmit.LoggerConfig'],
    create: (config: LoggerConfig) => DefaultLogger.fromConfig(config)
  }));

  return container;
}
