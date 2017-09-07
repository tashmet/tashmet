import * as Promise from 'bluebird';

export interface Transformer {
  /**
   * Transform an instance of class T to a plain object.
   */
  toInstance<T extends object>(plain: any, mode: string): Promise<T>;

  /**
   * Transform a plain object to an instance of class T.
   */
  toPlain<T extends object>(instance: T, mode: string): Promise<any>;
}

export interface ExposeConfig {
  persist?: boolean;

  relay?: boolean;
}
