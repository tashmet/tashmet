import { Aggregator } from "mingo";
import { Options as MingoOptions } from 'mingo/core';
import { AbstractAggregator, Document } from "./interfaces";


export class BufferAggregator extends AbstractAggregator<Document> {
  private aggregator: Aggregator;

  public constructor(pipeline: Document[], options: MingoOptions) {
    super(pipeline);
    this.aggregator = new Aggregator(pipeline, options);
  }

  public async *stream<TResult>(input: AsyncIterable<Document>): AsyncGenerator<TResult> {
    const buffer = [];
    for await (const item of input) {
      buffer.push(item)
    }
    const it = this.aggregator.stream(buffer);
    while (true) {
      const {value, done} = it.next();
      if (done && !value) {
        break;
      } else {
        yield value as TResult;
      }
    }
  }
}