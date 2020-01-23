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
}

export interface Sink {
  emit(event: LogEvent): void;
}

export abstract class SinkFactory extends Factory<Sink> {
  public abstract create(): Sink;
}

export interface Logger {
  info(message: string): void;

  debug(message: string): void;
  
  warn(message: string): void;

  error(message: string): void;
}

export interface LoggerConfig {
  level: LogLevel;
  sink: SinkFactory;
}
