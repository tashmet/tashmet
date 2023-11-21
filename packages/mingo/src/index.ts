import 'mingo/init/system';
import { Document } from '@tashmet/tashmet';
import { MingoAggregatorFactory, MingoConfig, MingoConfigurator, BufferAggregator, MingoOperatorContext } from '@tashmet/mingo-base';
import { getOperator, OperatorType } from 'mingo/core';
import * as mingo from 'mingo/core';
import { assert, cloneDeep } from 'mingo/util';
import { Iterator, Lazy } from 'mingo/lazy';
import { AbstractAggregator, AggregatorFactory, Store, PipelineOperator, AggregatorOptions, JsonSchemaValidator } from '@tashmet/engine';
import { Container, Logger, Optional, provider } from '@tashmet/core';
import jsonSchema from '@tashmet/schema';
import streamOperators from './operators.js';
import { CollectionBuffer } from '@tashmet/mingo-base/dist/aggregator.js';

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
    options: mingo.Options,
    buffer: CollectionBuffer,
    logger: Logger,
    private pipelineOperators: Record<string, PipelineOperator<any>>,
  ) {
    super(pipeline, options, buffer, logger);
  }

  public async *stream<TResult>(input: AsyncIterable<T>): AsyncGenerator<TResult> {
    let output = input;

    await this.buffer.load();

    for (const operator of this.pipeline) {
      const operatorKeys = Object.keys(operator);
      const op = operatorKeys[0];

      if (op in this.pipelineOperators) {
        output = this.pipelineOperators[op](
          output as AsyncIterable<T>, operator[op], new MingoOperatorContext(this.options)) as AsyncIterable<any>;
      } else {
        const call = getOperator(OperatorType.PIPELINE, op, this.options);
        assert(
          operatorKeys.length === 1 && !!call,
          `invalid aggregation operator ${op}`
        );

        if (defaultStreamOperators.includes(op)) {
          output = operatorStreamed(output, operator[op], call, this.options);
        } else {
          output = operatorBuffered(output, operator[op], call, this.options);
        }
      }
    }

    for await (const doc of output as unknown as AsyncIterable<TResult>) {
      yield doc;
    }

    await this.buffer.write();
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
  inject: [Store, Logger, MingoConfig, Optional.of(JsonSchemaValidator)]
})
export class MingoStreamAggregatorFactory extends MingoAggregatorFactory {
  constructor(
    store: Store,
    logger: Logger,
    config: MingoConfig,
    validator?: JsonSchemaValidator
  ) {
    super(store, logger, config, validator);
  }

  public createAggregator(pipeline: Document[], options: AggregatorOptions = {}): AbstractAggregator<Document> {
    const buffer = new CollectionBuffer(this.store, options.plan);

    return new StreamAggregator(pipeline, this.options(buffer, options), buffer, this.logger, this.pipelineOps);
  }
}

export default (config?: MingoConfig) => (container: Container) =>
  new MingoConfigurator(MingoStreamAggregatorFactory, container, config || {})
    .use(streamOperators())
    .use(jsonSchema())
