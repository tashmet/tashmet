import { TashmetCollectionNamespace } from '@tashmet/tashmet';
import { AbstractAggregator, ChangeSet, Store, QueryPlan } from '@tashmet/engine';
import { Logger } from '@tashmet/core';
import { Document } from '@tashmet/tashmet';
import { Aggregator } from 'mingo';
import { Options } from 'mingo/core';
import { cloneDeep } from 'mingo/util';

export async function toArray<T>(it: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of it) {
    result.push(item);
  }
  return result;
}

export class CollectionBuffer {
  private buffers: Record<string, Document[]> = {};
  private outNs: TashmetCollectionNamespace | undefined;
  private outInit: Document[] = [];

  public constructor(
    private store: Store,
    private plan: QueryPlan | undefined,
  ) {
    this.outNs = plan?.merge || plan?.out;
  }

  async load() {
    for (const ns of this.plan?.foreignCollections || []) {
      this.buffers[ns.toString()] = await toArray(this.store.getCollection(ns).read({}));
    }
    if (this.outNs) {
      this.outInit = cloneDeep(this.buffers[this.outNs.toString()]) as Document[];
    }
  }

  get(ns: TashmetCollectionNamespace): Document[] {
    return this.buffers[ns.toString()];
  }

  async write() {
    if (this.outNs) {
      const cs = new ChangeSet(this.get(this.outNs), this.outInit);
      await this.store.write(cs.toChanges({db: this.outNs.db, coll: this.outNs.collection}), {ordered: true});
    }
  }
}

// TODO: Should propably clone pipeline
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

export class BufferAggregator<T extends Document> extends AbstractAggregator<T> {
  private aggregator: Aggregator;

  constructor(
    pipeline: Document[],
    protected options: Options,
    protected buffer: CollectionBuffer,
    protected logger: Logger,
) {
    super(pipeline);
    this.aggregator = new Aggregator(preparePipeline(cloneDeep(this.pipeline) as Document[]), options);
  }

  async *stream<TResult>(input: AsyncIterable<Document>): AsyncGenerator<TResult> {
    await this.buffer.load();

    const buffer = await toArray(input);
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

    await this.buffer.write();
  }
}
