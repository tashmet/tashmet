import {LogEvent, Sink, LogLevel, SinkFactory} from './interfaces';

export class ConsoleWriter implements Sink {
  public emit(event: LogEvent) {
    const {message, severity, timestamp, scope} = event;
    const output = `[${scope.join('.')}] ${message}`;

    switch (severity) {
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
  public create() {
    return new ConsoleWriter();
  }
}

export const consoleWriter = () => new ConsoleWriterFactory();
