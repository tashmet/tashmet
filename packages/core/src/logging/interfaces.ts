import {Injection} from '../ioc/resolvers';

export const enum LogLevel {
  Debug,
  Info,
  Warning,
  Error,
  None,
};

export interface LogEvent {
  readonly message: string;
  readonly severity: LogLevel;
  readonly timestamp: number;
  readonly scope: string[];
}

export interface Sink {
  emit(event: LogEvent): void;
}

export type SinkFactory = () => Sink;

export declare interface Logger {
  readonly scope: string[];
  readonly parent: Logger | null;

  info(message: string): void;

  debug(message: string): void;

  warn(message: string): void;

  error(message: string): void;

  inScope(scope: string): Logger;
}

export abstract class Logger implements Logger {
  public static inScope(scope: string) {
    return Injection.of((logger: Logger) => logger.inScope(scope), [Logger]);
  }
}

export interface LoggerConfig {
  level: LogLevel;
  sink: SinkFactory | SinkFactory[];
}

export interface LogFormatter {
  format(event: LogEvent): string;
}
