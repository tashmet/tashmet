import {LogEvent, Sink, LogLevel, SinkFactory} from './interfaces';

export class ConsoleWriter implements Sink {
  public emit(event: LogEvent) {
    const {message, severity, timestamp} = event;

    switch (severity) {
      case LogLevel.Info:
        console.log(message);
        break;
      case LogLevel.Debug:
        console.debug(message);
        break;
      case LogLevel.Warning:
        console.warn(message);
        break;
      case LogLevel.Error:
        console.error(message);
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
