import {component, Provider} from '@ziqquratu/ioc';
import {LoggerConfig, LogLevel} from './interfaces';
import {DefaultLogger} from './logger';
import {consoleWriter} from './console';

export * from './interfaces';
export {consoleWriter};

@component({
  providers: [
    Provider.ofFactory({
      key: 'ziqquratu.Logger',
      inject: ['ziqquratu.LoggerConfig'],
      create: (config: LoggerConfig) => new DefaultLogger(config)
    }),
    Provider.ofInstance<LoggerConfig>('ziqquratu.LoggerConfig', {
      level: LogLevel.Error,
      sink: consoleWriter(),
    })
  ]
})
export default class Logging {}
