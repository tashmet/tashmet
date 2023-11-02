import { TashmetCollectionNamespace } from '@tashmet/tashmet';
import { AbstractAggregator, AggregatorOptions, ChangeSet, Store } from '@tashmet/engine';
import { Logger } from '@tashmet/core';
import { Document, Filter, FindOptions } from '@tashmet/tashmet';
import { Aggregator } from 'mingo';
import { initOptions, Options } from 'mingo/core.js';
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

export class CollectionBuffers {
  public constructor(private store: Store) {}
  private buffers: Record<string, Document[]> = {};

  public async load(ns: TashmetCollectionNamespace, create: boolean = false): Promise<Document[]> {
    return this.buffers[ns.toString()] = await toArray(this.store
      .getCollection(ns)
      .read({}));
  }

  public get(ns: TashmetCollectionNamespace): Document[] {
    return this.buffers[ns.toString()];
  }
}

export class BufferAggregator<T extends Document> extends AbstractAggregator<T> {
  private aggregator: Aggregator;
  private foreignBuffers: CollectionBuffers;
  private outInit: Document[] = [];

  public constructor(
    pipeline: Document[],
    private store: Store,
    private options: AggregatorOptions,
    private logger: Logger)
  {
    super(cloneDeep(pipeline) as Document[]);
    this.foreignBuffers = new CollectionBuffers(store);
    this.aggregator = new Aggregator(this.pipeline, this.mingoOptions);
  }

  public async *stream<TResult>(input: AsyncIterable<Document>): AsyncGenerator<TResult> {
    await this.loadBuffers();

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

    await this.writeBuffers();
  }

  protected get mingoOptions(): Options {
    return initOptions({
      collectionResolver: coll => {
        if (coll.includes('.')) {
          const ns = TashmetCollectionNamespace.fromString(coll);
          return this.foreignBuffers.get(ns);
        }
        if (this.options.queryAnalysis) {
          return this.foreignBuffers.get(new TashmetCollectionNamespace(this.options.queryAnalysis.ns.db, coll));
        }
        throw Error('cound not resolve collection');
      }
    });
  }

  protected get outNs(): TashmetCollectionNamespace | undefined {
    return this.options.queryAnalysis?.out || this.options.queryAnalysis?.merge;
  }

  protected async loadBuffers() {
    this.outInit = [];
    const qa = this.options.queryAnalysis;

    if (qa) {
      for (const ns of qa.foreignInputs) {
        await this.foreignBuffers.load(ns);
      }
      if (this.outNs) {
        const step = this.pipeline[this.pipeline.length - 1];

        if (qa.out && typeof step.$out !== 'string') {
          step.$out = `${step.$out.db}.${step.$out.coll}`;
        }
        if (qa.merge && typeof step.$merge.into !== 'string') {
          step.$merge.into = `${step.$merge.into.db}.${step.$merge.into.coll}`;
        }

        this.outInit = cloneDeep(this.foreignBuffers.get(this.outNs)) as Document[];
      }
    }
  }

  protected async writeBuffers() {
    if (this.outNs) {
      const cs = new ChangeSet(this.foreignBuffers.get(this.outNs), this.outInit);
      await this.store.write(cs.toChanges({db: this.outNs.db, coll: this.outNs.collection}), {ordered: true});
    }
  }
}
