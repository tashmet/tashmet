import {LogFormatter, LogEvent, Sink, LogLevel, SinkFactory} from './interfaces.js';

export class ScopeLogFormatter implements LogFormatter {
  private lastScope = '';

  public format(event: LogEvent) {
    const {message, timestamp, scope, severity} = event;
    const scopeName = scope.join('.');

    let output = '';
    if (scopeName !== this.lastScope) {
      output = this.formatScope(scope) + '\n';
      this.lastScope = scopeName;
    }
    return `${output}  ${this.formatTimestamp(timestamp)} ${this.formatMessage(message, severity)}`;
  }

  protected formatTimestamp(timestamp: number): string {
    const isoString = new Date(timestamp).toISOString();
    return isoString.substr(isoString.indexOf('T') + 1, 8);
  }

  protected formatScope(scope: string[]): string {
    return scope.join('.');
  }

  protected formatMessage(message: string, severity: LogLevel): string {
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

export interface ConsoleWriterConfig {
  format?: LogFormatter;
}

export function consoleWriter(config: ConsoleWriterConfig = {}): SinkFactory {
  return () => new ConsoleWriter(config.format || new ScopeLogFormatter());
}
