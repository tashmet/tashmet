import { Document } from '@tashmet/tashmet';
import { Query } from 'mingo/query.js';
import { op, OperatorPluginConfigurator } from '@tashmet/engine';
import { Container, provider } from '@tashmet/core';


@provider()
export class MingoStreamPipelineOpertors {
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

export default () => (container: Container) =>
  new OperatorPluginConfigurator(MingoStreamPipelineOpertors, container);
