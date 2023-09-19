import { ChangeSet } from '@tashmet/bridge';
import { AbstractAggregator } from '@tashmet/engine';
import {
  Document,
  Filter,
  FindOptions,
  Logger,
  provider
} from '@tashmet/tashmet';
import { Aggregator } from 'mingo';
import { cloneDeep } from 'mingo/util';

export interface PrefetchAggregation {
  filter: Filter<any>;
  options: FindOptions<any>;
  pipeline: Document[];
}

export async function toArray<T>(it: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of it) {
    result.push(item);
  }
  return result;
}
export class BufferAggregator extends AbstractAggregator<Document> {
  private aggregator: Aggregator;
  private foreignBuffers: Record<string, Document[]> = {};

  public constructor(pipeline: Document[], private options: any, private logger: Logger) {
    super(pipeline);
    this.aggregator = new Aggregator(pipeline, { collectionResolver: c => this.foreignBuffers[c] });
  }

  public async *stream<TResult>(input: AsyncIterable<Document>): AsyncGenerator<TResult> {
    for (const [k, v] of Object.entries(this.options.foreignInputs || {})) {
      this.foreignBuffers[k] = await toArray(v as any);
    }
    let mergeInit: Document[] = [];
    if (this.options.merge) {
      mergeInit = cloneDeep(this.foreignBuffers[this.options.merge]) as Document[];
    }

    const buffer = [];
    for await (const item of input) {
      buffer.push(item)
    }
    this.logger.inScope("MingoBufferAggregator").debug(`process buffer of ${buffer.length} document(s)`)
    const it = this.aggregator.stream(buffer);
    while (true) {
      const {value, done} = it.next();
      if (done && !value) {
        break;
      } else {
        yield value as TResult;
      }
    }

    if (this.options.merge) {
      const cs = new ChangeSet(this.foreignBuffers[this.options.merge], mergeInit);
      const changes = cs.toChanges({db: '', coll: this.options.merge});
      await this.options.writable.write(changes, {ordered: true});
    }
  }
}

@provider()
export class PrefetchAggregationStrategy {
  public create(pipeline: Document[]): PrefetchAggregation {

    let filter: Filter<any> = {};
    let options: FindOptions<any> = {};

    const handlers: Record<string, (value: any) => void> = {
      '$match': v => filter = v,
      '$sort': v => options.sort = v,
      '$skip': v => options.skip = v,
      '$limit': v => options.limit = v,
      '$project': v => options.projection = v,
    }

    const allAllowed = ['$match', '$sort', '$skip', '$limit', '$project'];
    const allowPreceding: Record<string, string[]> = {
      '$match': [],
      '$sort': ['$match'],
      '$skip': allAllowed,
      '$limit': allAllowed,
      '$project': allAllowed,
    };

    let prevStepOps: string[] = [];

    const isValid = (op: string) =>
      op in handlers && prevStepOps.every(prevOp => allowPreceding[op].includes(prevOp));

    for (let i = 0; i < pipeline.length; i++) {
      const step = pipeline[i];
      const op = Object.keys(step)[0];
      if (isValid(op)) {
        handlers[op](step[op]);
        prevStepOps.push(op);
      } else {
        break;
      }
    }

    return {filter, options, pipeline: pipeline.slice(prevStepOps.length)};
  }
}
