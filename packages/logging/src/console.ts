import {Formatter, LogEvent, Sink, LogLevel, SinkFactory} from './interfaces';

export class DefaultFormatter implements Formatter {
  public format(event: LogEvent) {
    const {message, timestamp, scope} = event;
    return scope.length > 0
      ? `[${this.timeString(timestamp)}] (${scope.join('.')}) ${message}`
      : `[${this.timeString(timestamp)}] ${message}`
  }

  protected timeString(timestamp: number): string {
    const isoString = new Date(timestamp).toISOString();
    return isoString.substr(isoString.indexOf('T') + 1, 8);
  }
}

export class ConsoleWriter implements Sink {
  public constructor(private formatter: Formatter) {}

  public emit(event: LogEvent) {
    const output = this.formatter.format(event);

    switch (event.severity) {
      case LogLevel.Info:
        console.log(output);
        break;
      case LogLevel.Debug:
        console.debug(output);
        break;
      case LogLevel.Warning:
        console.warn(output);
        break;
      case LogLevel.Error:
        console.error(output);
        break;
    }
  }
}

export class ConsoleWriterFactory extends SinkFactory {
  public constructor(
    private config: ConsoleWriterConfig
  ) { super(); }

  public create() {
    return new ConsoleWriter(this.config.formatter || new DefaultFormatter());
  }
}

export interface ConsoleWriterConfig {
  formatter?: Formatter;
}

export const consoleWriter = (config: ConsoleWriterConfig = {}) => new ConsoleWriterFactory(config);
