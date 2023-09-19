import { ChangeSet, ChangeStreamDocument } from '@tashmet/bridge';
import { AbstractAggregator, DocumentAccess } from '@tashmet/engine';
import {
  Document,
  Filter,
  FindOptions,
  Logger,
} from '@tashmet/tashmet';
import { Aggregator } from 'mingo';
import { cloneDeep } from 'mingo/util.js';

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

  public constructor(pipeline: Document[], private documentAccess: DocumentAccess, private options: any, private logger: Logger) {
    super(pipeline);
    this.aggregator = new Aggregator(pipeline, {
      collectionResolver: c => typeof c === 'string'
        ? this.foreignBuffers[`${options.qa.ns.db}.${c}`]
        : this.foreignBuffers[c]
    });
  }

  public async *stream<TResult>(input: AsyncIterable<Document>): AsyncGenerator<TResult> {
    let mergeInit: Document[] = [];

    if (this.options.qa) {
      for (const ns of this.options.qa.foreignInputs) {
        this.foreignBuffers[`${ns.db}.${ns.coll}`] = await toArray(this.documentAccess.stream(ns, {}));
      }
      if (this.options.qa.merge) {
        const ns = this.options.qa.merge;
        mergeInit = cloneDeep(this.foreignBuffers[`${ns.db}.${ns.coll}`]) as Document[];
      }
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

    if (this.options.qa && this.options.qa.merge) {
      const ns = this.options.qa.merge;
      const cs = new ChangeSet(this.foreignBuffers[`${ns.db}.${ns.coll}`], mergeInit);
      const changes = cs.toChanges(ns) as ChangeStreamDocument[];
      await this.documentAccess.write(changes, {ordered: true});
    }
  }
}
