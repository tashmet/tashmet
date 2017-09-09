import {Document} from '../models/document';
import * as Promise from 'bluebird';

export interface Transformer {
  /**
   * Transform a plain object to an instance of class T.
   */
  toInstance<T extends Document>(plain: any, mode: string, defaultModel?: string): Promise<T>;

  /**
   * Transform an instance of class T to a plain object.
   */
  toPlain<T extends Document>(instance: T, mode: string): Promise<any>;
}

export interface ModelConfig {
  name: string;

  exclude?: {[property: string]: 'persist' | 'relay' | 'always'};
}
