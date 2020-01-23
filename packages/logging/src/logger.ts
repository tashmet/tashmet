import {Logger, LoggerConfig, Sink, LogLevel} from './interfaces';
import {provider} from '@ziqquratu/ioc';

@provider({
  key: 'ziqquratu.Logger',
  inject: ['ziqquratu.LoggerConfig']
})
export class DefaultLogger implements Logger {
  private sink: Sink;

  public constructor(private config: LoggerConfig) {
    this.sink = this.config.sink.create();
  }

  public info(message: string) {
    this.emit(message, LogLevel.Info);
  }

  public debug(message: string) {
    this.emit(message, LogLevel.Debug);
  }

  public warn(message: string) {
    this.emit(message, LogLevel.Warning);
  }

  public error(message: string) {
    this.emit(message, LogLevel.Error);
  }

  private emit(message: string, severity: LogLevel) {
    this.sink.emit({message, severity, timestamp: new Date().getTime()});
  }
}
