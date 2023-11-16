import 'mingo/init/system';
import { Document } from '@tashmet/tashmet';
import { MingoAggregatorFactory, MingoConfig, MingoConfigurator, BufferAggregator } from '@tashmet/mingo-base';
import { getOperator, OperatorType, Context } from 'mingo/core';
import * as mingo from 'mingo/core';
import { assert, cloneDeep } from 'mingo/util';
import { Iterator, Lazy } from 'mingo/lazy';
import { AbstractAggregator, AggregatorFactory, Store, PipelineOperator, AggregatorOptions, JsonSchemaValidator } from '@tashmet/engine';
import { Container, Logger, Optional, provider } from '@tashmet/core';
import jsonSchema from '@tashmet/schema';
import streamOperators from './operators.js';

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
    options: AggregatorOptions,
    config: MingoConfig,
    context: Context,
    logger: Logger,
    validator?: JsonSchemaValidator
  ) {
    super(pipeline, store, options, config, context, logger, validator);
  }

  public async *stream<TResult>(input: AsyncIterable<T>): AsyncGenerator<TResult> {
    let output = input;

    await this.loadBuffers();

    for (const operator of this.pipeline) {
      const operatorKeys = Object.keys(operator);
      const op = operatorKeys[0];

      if (op in this.pipelineOperators) {
        output = this.pipelineOperators[op](output as AsyncIterable<T>, operator[op], (doc, path) =>
          mingo.computeValue(doc, path, null, this.mingoOptions)
        ) as AsyncIterable<any>;
      } else {
        const call = getOperator(OperatorType.PIPELINE, op, this.mingoOptions);
        assert(
          operatorKeys.length === 1 && !!call,
          `invalid aggregation operator ${op}`
        );

        if (defaultStreamOperators.includes(op)) {
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
  inject: [Store, Logger, MingoConfig, Optional.of(JsonSchemaValidator)]
})
export class MingoStreamAggregatorFactory extends MingoAggregatorFactory {
  public constructor(
    store: Store,
    logger: Logger,
    config: MingoConfig,
    validator?: JsonSchemaValidator
  ) {
    super(store, logger, config, validator);
  }

  public createAggregator(pipeline: Document[], options: AggregatorOptions): AbstractAggregator<Document> {
    const context: mingo.Context = mingo.Context.init({
      expression: this.expressionOps
    });

    return new StreamAggregator(pipeline, this.pipelineOps, this.store, options, this.config, context, this.logger, this.validator);
  }
}

export default (config?: MingoConfig) => (container: Container) =>
  new MingoConfigurator(MingoStreamAggregatorFactory, container, config || {})
    .use(streamOperators())
    .use(jsonSchema())
