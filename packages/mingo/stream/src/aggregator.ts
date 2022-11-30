import { Document, provider } from '@tashmet/tashmet';
import { getOperator, OperatorType, initOptions } from 'mingo/core';
import { Query } from 'mingo/query';
import { assert, cloneDeep } from 'mingo/util';
import { Iterator, Lazy } from 'mingo/lazy';
import { AbstractAggregator, AggregatorFactory } from '@tashmet/engine';

export async function toArray<T>(it: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of it) {
    result.push(item);
  }
  return result;
}

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


export class StreamAggregator<T extends Document = Document> extends AbstractAggregator {
  public constructor(
    public readonly pipeline: Document[],
    private operators: Record<string, any> = defaultOperators,
    private streamOperators: string[] = defaultStreamOperators,
  ) { super(pipeline); }

  public stream<TResult>(input: AsyncIterable<T>): AsyncIterable<TResult> {
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

    return output as unknown as AsyncIterable<TResult>;
  }

  async* operatorStreamed<T>(source: AsyncIterable<T>, expr: any, mingoOp: any, options: any) {
    for await (const item of source) {
      const it = mingoOp(Lazy([cloneDeep(item)]), expr, options) as Iterator;

      for (const item of it.value() as any[]) {
        yield item;
      }
    }
  }

  async* operatorBuffered<T>(source: AsyncIterable<T>, expr: any, mingoOp: any, options: any) {
    const buffer = await toArray(source);
    const it = mingoOp(Lazy(buffer).map(cloneDeep), expr, options) as Iterator;
    for (const item of it.value() as any[]) {
      yield item;
    }
  }
}


@provider({
  key: AggregatorFactory,
})
export class MingoStreamAggregatorFactory implements AggregatorFactory {
  public createAggregator(pipeline: Document[], options: any): AbstractAggregator<Document> {
    return new StreamAggregator(pipeline);
  }
}
