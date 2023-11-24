import 'mingo/init/system';
import { AbstractAggregator, PipelineOperator } from '@tashmet/engine';
import { Logger } from '@tashmet/core';
import { Document } from '@tashmet/tashmet';
import { Options } from 'mingo/core';
import { cloneDeep } from 'mingo/util';
import { CollectionBuffer } from './buffer.js';
import { MingoOperatorContext } from './operator.js';


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
        const func = this.pipelineOperators[op];
        const ctx = new MingoOperatorContext(op, this.options);

        output = func(output as AsyncIterable<T>, operator[op], ctx) as AsyncIterable<any>;
      } else {
        throw Error(`Invalid aggregation operator: ${op}`);
      }
    }

    for await (const doc of output as unknown as AsyncIterable<TResult>) {
      yield doc;
    }

    await this.buffer.write();
  }
}
