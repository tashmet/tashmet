import {Logger, LoggerConfig, Sink, LogLevel} from './interfaces';

export class DefaultLogger implements Logger {
  private sink: Sink;

  public constructor(
    private config: LoggerConfig,
    public scope: string[] = [],
    public parent: Logger | null = null,
  ) {
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

  public inScope(scope: string): Logger {
    return new DefaultLogger(this.config, [...this.scope, scope], this);
  }

  private emit(message: string, severity: LogLevel) {
    if (severity >= this.config.level) {
      this.sink.emit({message, severity, timestamp: new Date().getTime(), scope: this.scope});
    }
  }
}
