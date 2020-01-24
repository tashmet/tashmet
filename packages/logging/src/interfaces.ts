import {Factory} from '@ziqquratu/ioc';

export const enum LogLevel {
  Debug,
  Info,
  Warning,
  Error,
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

export abstract class SinkFactory extends Factory<Sink> {
  public abstract create(): Sink;
}

export interface Logger {
  readonly scope: string[];
  readonly parent: Logger | null;

  info(message: string): void;

  debug(message: string): void;

  warn(message: string): void;

  error(message: string): void;

  inScope(scope: string): Logger;
}

export interface LoggerConfig {
  level: LogLevel;
  sink: SinkFactory | SinkFactory[];
}

export interface Formatter {
  format(event: LogEvent): string;
}
