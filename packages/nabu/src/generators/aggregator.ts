import { Document } from '@tashmet/tashmet';
import { getOperator, OperatorType, initOptions } from 'mingo/core';
import { Query } from 'mingo/query';
import { assert } from 'mingo/util';
import { Iterator, Lazy } from 'mingo/lazy';
import { toArray } from './interfaces';

async function* $skip<T>(source: AsyncIterable<T>, expr: any) {
  let n = 0;
  for await (const item of source) {
    if (n >= expr) {
      yield item;
    }
    n++;
  }
}

async function* $limit<T>(source: AsyncIterable<T>, expr: any) {
  let n = 0;
  for await (const item of source) {
    if (n < expr) {
      yield item;
    } else {
      break;
    }
    n++;
  }
}

async function* $match<T>(source: AsyncIterable<T>, expr: any) {
  const q = new Query(expr);
  for await (const item of source) {
    if (q.test(item as any)) {
      yield item;
    }
  }
}

export const defaultOperators: Record<string, any> = {
  $skip, $limit, $match,
}

export const defaultStreamOperators: string[] = [
  '$addFields', '$set', '$project', '$replaceRoot', '$unset', '$unwind',
]


export class StreamAggregator<T extends Document = Document> {
  public constructor(
    public readonly pipeline: Document[],
    private operators: Record<string, any> = defaultOperators,
    private streamOperators: string[] = defaultStreamOperators,
  ) {}

  public stream(input: AsyncIterable<Document>): AsyncIterable<T> {
    let output = input;

    for (const operator of this.pipeline) {
      const operatorKeys = Object.keys(operator);
      const op = operatorKeys[0];
      const call = getOperator(OperatorType.PIPELINE, op);
      assert(
        operatorKeys.length === 1 && !!call,
        `invalid aggregation operator ${op}`
      );

      if (op in this.operators) {
        output = this.operators[op](output, operator[op], call, initOptions());
      } else if (this.streamOperators.includes(op)) {
        output = this.operatorStreamed(output, operator[op], call, initOptions());
      } else {
        output = this.operatorBuffered(output, operator[op], call, initOptions());
      }
    }

    return output as AsyncIterable<T>;
  }

  async* operatorStreamed<T>(source: AsyncIterable<T>, expr: any, mingoOp: any, options: any) {
    for await (const item of source) {
      const it = mingoOp(Lazy([item]), expr, options) as Iterator;

      for (const item of it.value() as any[]) {
        yield item;
      }
    }
  }

  async* operatorBuffered<T>(source: AsyncIterable<T>, expr: any, mingoOp: any, options: any) {
    const buffer = await toArray(source);
    const it = mingoOp(Lazy(buffer), expr, options) as Iterator;
    for (const item of it.value() as any[]) {
      yield item;
    }
  }
}
