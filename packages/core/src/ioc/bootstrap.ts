import {Container} from './interfaces.js';
import {BasicContainer} from './container.js';
import {Provider} from './provider.js';
import {Logger, LogLevel, LoggerConfig, LogFormatter} from '../logging/interfaces.js';
import {DefaultLogger} from '../logging/logger.js';
import {consoleWriter} from '../logging/console.js';

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
  container.register(Provider.ofInstance('tashmet.LoggerConfig', loggerConfig));
  container.register(Provider.ofFactory({
    key: Logger,
    inject: ['tashmet.LoggerConfig'],
    create: (config: LoggerConfig) => DefaultLogger.fromConfig(config)
  }));

  return container;
}
