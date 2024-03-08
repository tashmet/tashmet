import { Document } from '@tashmet/tashmet';
import { AggregatorFactory, op, OperatorPluginConfigurator } from '@tashmet/engine';
import { Container, provider } from '@tashmet/core';
import { Query } from 'mingo/query';
import { getOperator, OperatorType, PipelineOperator } from 'mingo/core';
import { Iterator, Lazy } from 'mingo/lazy';
import { cloneDeep } from 'mingo/util';
import { updateObject } from "mingo/updater";
import { toArray } from './util.js';
import { MingoOperatorContext } from './operator.js';

/**
 * Pipeline operators
 * 
 * Since mingo does not support async interators we provide a means to go
 * around that limitation by allowing at least a subset of pipeline 
 * operators to be streamed asynchronously, with the rest being async but
 * with buffering of the previous step.
 */
@provider({
  inject: [AggregatorFactory],
})
export class MingoStreamPipelineOpertors {
  constructor(private factory: AggregatorFactory) {}

  /**
   * Handler for all mingo pipeline operators that can be streamed.
   * 
   * This generator will take one document at a time from the input and pass it
   * to the mingo operator as a list with a single item. All documents from the
   * result iterator will be yielded before continuing reading the next document
   * from the input.
   */
  @op.pipeline([
    '$addFields',
    '$fill',
    '$lookup',
    '$merge',
    '$out',
    '$project',
    '$redact',
    '$replaceRoot',
    '$set',
    '$unset',
    '$unwind'
  ])
  async* operatorStreamed<T>(source: AsyncIterable<T>, expr: any, ctx: MingoOperatorContext) {
    const mingoOp = getOperator(OperatorType.PIPELINE, ctx.op, ctx.options) as PipelineOperator;
    for await (const item of source) {
      const it = mingoOp(Lazy([cloneDeep(item)]), expr, ctx.options) as Iterator;

      for (const item of it.value() as any[]) {
        yield item;
      }
    }
  }

  /**
   * Handler for all mingo pipeline operators that can not be streamed
   * 
   * This generator will load a buffer of all documents from the input and then
   * proceed by passing that buffer to the mingo operator. the resulting
   * documents will be yielded one by one once the whole operation is done.
   */
  @op.pipeline([
    '$bucket',
    '$bucketAuto',
    '$count',
    '$facet',
    '$group',
    '$sample',
    '$setWindowFields',
    '$sort', 
    '$sortByCount', 
    '$unionWith'
  ])
  async* operatorBuffered<T>(source: AsyncIterable<T>, expr: any, ctx: MingoOperatorContext) {
    const mingoOp = getOperator(OperatorType.PIPELINE, ctx.op, ctx.options) as PipelineOperator;
    const buffer = await toArray(source);
    const it = mingoOp(Lazy(buffer).map(cloneDeep), expr, ctx.options) as Iterator;
    for (const item of it.value() as any[]) {
      yield item;
    }
  }

  /** Custom $match operator that enables streaming */
  @op.pipeline('$match')
  async* $match(source: AsyncIterable<Document>, expr: Document, ctx: MingoOperatorContext) {
    const q = new Query(expr, ctx.options);
    for await (const item of source) {
      if (q.test(item as any)) {
        yield item;
      }
    }
  }

  /**
   * Since mingo seems to not take into account that replaceWith has a
   * different form than replaceRoot, we override it.
   */
  @op.pipeline('$replaceWith')
  $replaceWith(source: AsyncIterable<Document>, expr: Document, ctx: MingoOperatorContext) {
    return this.operatorStreamed(source, { newRoot: expr }, ctx);
  }

  /** Custom $skip operator that enables streaming */
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

  /** Custom $limit operator that enables streaming */
  @op.pipeline('$limit')
  async* $limit(source: AsyncIterable<Document>, expr: number) {
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

  /** No support for $documents operator in mingo so we provide our own */
  @op.pipeline('$documents')
  async* $documents(source: AsyncIterable<Document>, expr: Document[]) {
    for await (const doc of expr) {
      yield doc;
    }
  }

  /** Custom operator to allow for update expresssions in an aggregation pipeline */
  @op.pipeline('$update')
  async* $update(source: AsyncIterable<Document>, expr: any) {
    for await (const item of source) {
      const clone = cloneDeep(item) as any;
      updateObject(clone, expr);
      yield clone;
    }
  }

  @op.pipeline('$facet')
  async* $facet(source: AsyncIterable<Document>, expr: Document) {
    const output: Document = {};
    const array = await toArray(source);
    for (const [k, pipeline] of Object.entries(expr)) {
      const aggregator = this.factory.createAggregator(pipeline);
      output[k] = await aggregator.run(array);
    }
    yield output;
  }

  @op.pipeline('$log')
  async *$log(source: AsyncIterable<Document>, expr: any, ctx: MingoOperatorContext) {
    for await (const item of source) {
      const data = ctx.compute(item, expr);
      console.log(data);
      yield item;
    }
  }
}

export default () => (container: Container) =>
  new OperatorPluginConfigurator(MingoStreamPipelineOpertors, container);
