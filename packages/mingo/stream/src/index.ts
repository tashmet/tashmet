import 'mingo/init/system.js';
import { Document } from '@tashmet/tashmet';
import { MingoAggregatorFactory, MingoConfig, MingoConfigurator, BufferAggregator } from '@tashmet/mingo';
import { getOperator, OperatorType } from 'mingo/core.js';
import * as mingo from 'mingo/core.js';
import { Query } from 'mingo/query.js';
import { assert, cloneDeep } from 'mingo/util.js';
import { Iterator, Lazy } from 'mingo/lazy.js';
import { AbstractAggregator, AggregatorFactory, Store, op, PipelineOperator } from '@tashmet/engine';
import { Container, Logger, provider } from '@tashmet/core';

export async function toArray<T>(it: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of it) {
    result.push(item);
  }
  return result;
}

export const defaultStreamOperators: string[] = [
  '$addFields', '$set', '$project', '$replaceRoot', '$unset', '$unwind',
]


export class StreamAggregator<T extends Document = Document> extends BufferAggregator<T> {
  public constructor(
    pipeline: Document[],
    private pipelineOperators: Record<string, PipelineOperator<any>>,
    store: Store,
    options: any,
    logger: Logger,
    private streamOperators: string[] = defaultStreamOperators,
  ) {
    super(pipeline, store, options, logger);
  }

  public async *stream<TResult>(input: AsyncIterable<T>): AsyncGenerator<TResult> {
    let output = input;

    await this.loadBuffers();

    for (const operator of this.pipeline) {
      const operatorKeys = Object.keys(operator);
      const op = operatorKeys[0];

      if (op in this.pipelineOperators) {
        output = this.pipelineOperators[op](output, operator[op], (doc, path) => mingo.computeValue(doc, path)) as AsyncIterable<T>;
      } else {
        const call = getOperator(OperatorType.PIPELINE, op);
        assert(
          operatorKeys.length === 1 && !!call,
          `invalid aggregation operator ${op}`
        );

        if (this.streamOperators.includes(op)) {
          output = operatorStreamed(output, operator[op], call, this.mingoOptions);
        } else {
          output = operatorBuffered(output, operator[op], call, this.mingoOptions);
        }
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
export class MingoStreamAggregatorFactory extends MingoAggregatorFactory {
  public constructor(store: Store, logger: Logger) {
    super(store, logger);
    this.addPipelineOperator('$match', this.$match);
    this.addPipelineOperator('$skip', this.$skip);
    this.addPipelineOperator('$limit', this.$limit);
  }

  public createAggregator(pipeline: Document[], options: any): AbstractAggregator<Document> {
    return new StreamAggregator(pipeline, this.pipelineOps, this.store, options, this.logger);
  }

  @op.pipeline('$match')
  async* $match(source: AsyncIterable<Document>, expr: Document) {
    const q = new Query(expr);
    for await (const item of source) {
      if (q.test(item as any)) {
        yield item;
      }
    }
  }

  @op.pipeline('$skip')
  async* $skip(source: AsyncIterable<Document>, expr: number) {
    let n = 0;
    for await (const item of source) {
      if (n >= expr) {
        yield item;
      }
      n++;
    }
  }

  @op.pipeline('$limit')
  async* $limit<T>(source: AsyncIterable<Document>, expr: number) {
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
}

export default (config?: MingoConfig) => (container: Container) =>
  new MingoConfigurator(MingoStreamAggregatorFactory, container, config || {});
