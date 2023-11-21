import 'mingo/init/system';
import { AbstractAggregator, PipelineOperator } from '@tashmet/engine';
import { Logger } from '@tashmet/core';
import { Document } from '@tashmet/tashmet';
import { Options } from 'mingo/core';
import { assert, cloneDeep } from 'mingo/util';
import { CollectionBuffer } from './buffer.js';
import { toArray } from './util.js';
import { getOperator, OperatorType } from 'mingo/core';
import { Iterator, Lazy } from 'mingo/lazy';
import { MingoOperatorContext } from './operator.js';

export const defaultStreamOperators: string[] = [
  '$addFields', '$set', '$project', '$replaceRoot', '$unset', '$unwind',
]

export function preparePipeline(pipeline: Document[]) {
  if (pipeline.length === 0) {
    return pipeline;
  }

  const lastStep = pipeline[pipeline.length - 1];

  if (lastStep.$merge && typeof lastStep.$merge.into === 'object') {
    lastStep.$merge.into = `${lastStep.$merge.into.db}.${lastStep.$merge.into.coll}`;
  }
  if (lastStep.$out && typeof lastStep.$out === 'object') {
    lastStep.$out = `${lastStep.$out.db}.${lastStep.$out.coll}`;
  }

  return pipeline;
}

export class MingoStreamAggregator<T extends Document> extends AbstractAggregator<T> {
  constructor(
    pipeline: Document[],
    private options: Options,
    private buffer: CollectionBuffer,
    private logger: Logger,
    private pipelineOperators: Record<string, PipelineOperator<any>>,
  ) {
    super(preparePipeline(cloneDeep(pipeline) as Document[]));
  }

  async *stream<TResult>(input: AsyncIterable<T>): AsyncGenerator<TResult> {
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