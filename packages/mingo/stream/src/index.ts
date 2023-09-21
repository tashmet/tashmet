import 'mingo/init/system.js';
import { Document, provider } from '@tashmet/tashmet';
import { MingoConfig, MingoConfigurator, BufferAggregator } from '@tashmet/mingo';
import { getOperator, OperatorType } from 'mingo/core.js';
import { Query } from 'mingo/query.js';
import { assert, cloneDeep } from 'mingo/util.js';
import { Iterator, Lazy } from 'mingo/lazy.js';
import { AbstractAggregator, AggregatorFactory, DocumentAccess } from '@tashmet/engine';
import { BootstrapConfig, Container, Logger, plugin } from '@tashmet/core';

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


export class StreamAggregator<T extends Document = Document> extends BufferAggregator<T> {
  public constructor(
    public readonly pipeline: Document[],
    documentAccess: DocumentAccess,
    options: any,
    logger: Logger,
    private operators: Record<string, any> = defaultOperators,
    private streamOperators: string[] = defaultStreamOperators,
  ) {
    super(pipeline, documentAccess, options, logger);
  }

  public async *stream<TResult>(input: AsyncIterable<T>): AsyncGenerator<TResult> {
    let output = input;

    await this.loadBuffers();

    for (const operator of this.pipeline) {
      const operatorKeys = Object.keys(operator);
      const op = operatorKeys[0];
      const call = getOperator(OperatorType.PIPELINE, op);
      assert(
        operatorKeys.length === 1 && !!call,
        `invalid aggregation operator ${op}`
      );

      if (op in this.operators) {
        output = this.operators[op](output, operator[op], call,this.mingoOptions);
      } else if (this.streamOperators.includes(op)) {
        output = operatorStreamed(output, operator[op], call, this.mingoOptions);
      } else {
        output = operatorBuffered(output, operator[op], call, this.mingoOptions);
      }
    }

    for await (const doc of output as unknown as AsyncIterable<TResult>) {
      yield doc;
    }

    await this.writeBuffers();
  }
}

async function* operatorStreamed<T>(source: AsyncIterable<T>, expr: any, mingoOp: any, options: any) {
  for await (const item of source) {
    const it = mingoOp(Lazy([cloneDeep(item)]), expr, options) as Iterator;

    for (const item of it.value() as any[]) {
      yield item;
    }
  }
}

async function* operatorBuffered<T>(source: AsyncIterable<T>, expr: any, mingoOp: any, options: any) {
  const buffer = await toArray(source);
  const it = mingoOp(Lazy(buffer).map(cloneDeep), expr, options) as Iterator;
  for (const item of it.value() as any[]) {
    yield item;
  }
}


@provider({
  key: AggregatorFactory,
})
@plugin<Partial<MingoConfig>>()
export default class MingoStreamAggregatorFactory implements AggregatorFactory {
  public constructor(private documentAccess: DocumentAccess, private logger: Logger) {}

  public static configure(config: Partial<BootstrapConfig> & Partial<MingoConfig>, container?: Container) {
    return new MingoConfigurator(MingoStreamAggregatorFactory, config, container);
  }

  public createAggregator(pipeline: Document[], options: any): AbstractAggregator<Document> {
    return new StreamAggregator(pipeline, this.documentAccess, options, this.logger);
  }
}
