import * as Promise from 'bluebird';

export interface Transformer {
  /**
   * Validate an instance of class T against that instances model definition.
   */
  validate<T>(instance: T): Promise<any>;

  /**
   * Transform an instance of class T to a plain object.
   */
  toInstance<T>(plain: any, mode: string): Promise<T>;

  /**
   * Transform a plain object to an instance of class T.
   */
  toPlain<T>(instance: T, mode: string): Promise<any>;
}

export interface ExposeConfig {
  persist?: boolean;

  relay?: boolean;
}

export interface NumberModelConfig {}

export interface StringModelConfig {
  minLength?: number;

  maxLength?: number;

  pattern?: RegExp;

  format?: 'date-time' | 'email' | 'hostname' | 'ipv4' | 'ipv6' | 'uri';
}
