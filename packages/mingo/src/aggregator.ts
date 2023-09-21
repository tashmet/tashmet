import { ChangeSet, Namespace } from '@tashmet/bridge';
import { AbstractAggregator, AggregatorOptions, DocumentAccess } from '@tashmet/engine';
import {
  Document,
  Filter,
  FindOptions,
  Logger,
} from '@tashmet/tashmet';
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
  public constructor(private documentAccess: DocumentAccess) {}
  private buffers: Record<string, Document[]> = {};

  public async load(ns: Namespace): Promise<Document[]> {
    return this.buffers[`${ns.db}.${ns.coll}`] = await toArray(this.documentAccess.stream(ns, {}));
  }

  public get(ns: Namespace): Document[] {
    return this.buffers[`${ns.db}.${ns.coll}`];
  }
}

export class BufferAggregator<T extends Document> extends AbstractAggregator<T> {
  private aggregator: Aggregator;
  private foreignBuffers: CollectionBuffers;
  private outInit: Document[] = [];

  public constructor(
    pipeline: Document[],
    private documentAccess: DocumentAccess,
    private options: AggregatorOptions,
    private logger: Logger)
  {
    super(pipeline);
    this.foreignBuffers = new CollectionBuffers(documentAccess);
    this.aggregator = new Aggregator(pipeline, this.mingoOptions);
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
        if (this.options.queryAnalysis) {
          return this.foreignBuffers.get({db: this.options.queryAnalysis.ns.db, coll});
        }
        throw Error('cound not resolve collection');
      }
    });
  }

  protected get outNs(): Namespace | undefined {
    return this.options.queryAnalysis?.out || this.options.queryAnalysis?.merge;
  }

  protected async loadBuffers() {
    this.outInit = [];

    if (this.options.queryAnalysis) {
      for (const ns of this.options.queryAnalysis.foreignInputs) {
        await this.foreignBuffers.load(ns);
      }
      if (this.outNs) {
        this.outInit = cloneDeep(this.foreignBuffers.get(this.outNs)) as Document[];
      }
    }
  }

  protected async writeBuffers() {
    if (this.outNs) {
      const cs = new ChangeSet(this.foreignBuffers.get(this.outNs), this.outInit);
      await this.documentAccess.write(cs.toChanges(this.outNs), {ordered: true});
    }
  }
}
