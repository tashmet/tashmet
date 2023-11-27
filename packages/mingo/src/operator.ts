import { ExpressionOperator, QueryOperator } from '@tashmet/engine';
import { setValue, removeValue, resolve } from 'mingo/util';
import * as mingo from 'mingo/core';
import { OperatorContext } from '@tashmet/engine';


export class MingoOperatorContext implements OperatorContext {
  constructor(public readonly op: string, public readonly options: mingo.Options) {}

  set(obj: Record<string, any> | Array<any>, selector: string, value: any): void {
    setValue(obj, selector, value);
  }

  remove(obj: Record<string, any> | Array<any>, selector: string): void {
    removeValue(obj, selector);
  }

  resolve(obj: any[] | Record<string, any>, selector: string) {
    return resolve(obj, selector);
  }

  compute(obj: any, expr: any, operator?: string) {
    return mingo.computeValue(obj, expr, operator || null, this.options);
  }

  log(message: string) {
    console.log(message);
  }
}


export function makeExpressionOperator(name: string, op: ExpressionOperator<any>): mingo.ExpressionOperator  {
  return (obj, expr, options) => op(obj, expr, new MingoOperatorContext(name, options));
}

export function makeQueryOperator(name: string, op: QueryOperator<any>): mingo.QueryOperator  {
  return (selector, value, options) => op(selector, value, new MingoOperatorContext(name, options));
}