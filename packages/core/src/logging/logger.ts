import {Logger, LoggerConfig, Sink, LogLevel, SinkFactory} from './interfaces';

export class DefaultLogger extends Logger {
  public static fromConfig(config: LoggerConfig): Logger {
    return new DefaultLogger(
      config.level, ([] as SinkFactory[]).concat(config.sink).map(f => f.create())
    );
  }

  public constructor(
    private level: LogLevel = LogLevel.None,
    private sinks: Sink[] = [],
    public readonly scope: string[] = [],
    public readonly parent: Logger | null = null,
  ) { super(); }

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
    return new DefaultLogger(this.level, this.sinks, [...this.scope, scope], this);
  }

  private emit(message: string, severity: LogLevel) {
    if (severity >= this.level) {
      for (const sink of this.sinks) {
        sink.emit({message, severity, timestamp: new Date().getTime(), scope: this.scope});
      }
    }
  }
}
