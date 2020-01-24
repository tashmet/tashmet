import {Logger, LoggerConfig, Sink, LogLevel, SinkFactory} from './interfaces';

export class DefaultLogger implements Logger {
  private sinks: Sink[];

  public constructor(
    private config: LoggerConfig,
    public scope: string[] = [],
    public parent: Logger | null = null,
  ) {
    this.sinks = ([] as SinkFactory[]).concat(this.config.sink).map(f => f.create());
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

  public inScope(scope: string): Logger {
    return new DefaultLogger(this.config, [...this.scope, scope], this);
  }

  private emit(message: string, severity: LogLevel) {
    if (severity >= this.config.level) {
      for (const sink of this.sinks) {
        sink.emit({message, severity, timestamp: new Date().getTime(), scope: this.scope});
      }
    }
  }
}
