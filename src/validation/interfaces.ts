import * as Promise from 'bluebird';

export interface Validator {
  validate(instance: any): Promise<any>;
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
