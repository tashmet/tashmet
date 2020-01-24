import {LogFormatter, LogEvent, Sink, LogLevel, SinkFactory} from './interfaces';

export class ScopeLogFormatter implements LogFormatter {
  private lastScope = '';

  public format(event: LogEvent) {
    const {message, timestamp, scope} = event;
    const scopeName = scope.join('.');
    
    let output = '';
    if (scopeName !== this.lastScope) {
      output = this.formatScope(scope) + '\n';
      this.lastScope = scopeName;
    }
    return `${output}  ${this.formatTimestamp(timestamp)} ${this.formatMessage(message)}`;
  }

  protected formatTimestamp(timestamp: number): string {
    const isoString = new Date(timestamp).toISOString();
    return isoString.substr(isoString.indexOf('T') + 1, 8);
  }

  protected formatScope(scope: string[]): string {
    return scope.join('.');
  }

  protected formatMessage(message: string): string {
    return message;
  }
}

export class ConsoleWriter implements Sink {
  public constructor(private formatter: LogFormatter) {}

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
    return new ConsoleWriter(this.config.format || new ScopeLogFormatter());
  }
}

export interface ConsoleWriterConfig {
  format?: LogFormatter;
}

export const consoleWriter = (config: ConsoleWriterConfig = {}) => new ConsoleWriterFactory(config);
