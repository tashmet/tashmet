import { ExpressionOperator } from '@tashmet/engine';
import { setValue, removeValue, resolve } from 'mingo/util';
import * as mingo from 'mingo/core';
import { OperatorContext } from '@tashmet/engine';


export class MingoOperatorContext implements OperatorContext {
  constructor(private options: mingo.Options) {}

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
}


export function makeExpressionOperator(op: ExpressionOperator<any>): mingo.ExpressionOperator  {
  return (obj, expr, options) => op(obj, expr, new MingoOperatorContext(options));
}
