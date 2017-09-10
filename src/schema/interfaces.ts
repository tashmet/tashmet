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

export interface Validator {
  validate(instance: any): Promise<any>;
}

export interface ModelConfig {
  name: string;

  exclude?: {[property: string]: 'persist' | 'relay' | 'always'};
}

export interface ArrayTypeConfig {
  items?: {type: Function};

  minItems?: number;

  maxItems?: number;

  uniqueItems?: boolean;
}

export interface NumberTypeConfig {
  multipleOf?: number;

  minimum?: number;

  maximum?: number;
}

export interface StringTypeConfig {
  minLength?: number;

  maxLength?: number;

  pattern?: RegExp;

  format?: 'date-time' | 'email' | 'hostname' | 'ipv4' | 'ipv6' | 'uri';
}

export interface DateTypeConfig {
  min?: Date;

  max?: Date;
}
