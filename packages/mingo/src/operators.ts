import { Document } from '@tashmet/tashmet';
import { Query } from 'mingo/query';
import { op, OperatorPluginConfigurator } from '@tashmet/engine';
import { Container, provider } from '@tashmet/core';
import { updateObject } from "mingo/updater";
import { cloneDeep } from 'mingo/util';


@provider()
export class MingoStreamPipelineOpertors {
  //@op.pipeline('$match')
  //async* $match(source: AsyncIterable<Document>, expr: Document) {
    //const q = new Query(expr, );
    //for await (const item of source) {
      //if (q.test(item as any)) {
        //yield item;
      //}
    //}
  //}

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

  @op.pipeline('$documents')
  async* $documents(source: AsyncIterable<Document>, expr: Document[]) {
    for await (const doc of expr) {
      yield doc;
    }
  }

  @op.pipeline('$update')
  async* $update(source: AsyncIterable<Document>, expr: any) {
    for await (const item of source) {
      const clone = cloneDeep(item) as any;
      updateObject(clone, expr);
      yield clone;
    }
  }
}

export default () => (container: Container) =>
  new OperatorPluginConfigurator(MingoStreamPipelineOpertors, container);
