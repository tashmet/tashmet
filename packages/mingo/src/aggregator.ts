import { ChangeSet, ChangeStreamDocument, Namespace } from '@tashmet/bridge';
import { AbstractAggregator, AggregatorOptions, DocumentAccess } from '@tashmet/engine';
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

class CollectionBuffers {
  public constructor(private documentAccess: DocumentAccess) {}
  private buffers: Record<string, Document[]> = {};

  public async load(ns: Namespace): Promise<void> {
    this.buffers[`${ns.db}.${ns.coll}`] = await toArray(this.documentAccess.stream(ns, {}));
  }

  public get(ns: Namespace): Document[] {
    return this.buffers[`${ns.db}.${ns.coll}`];
  }
}

export class BufferAggregator extends AbstractAggregator<Document> {
  private aggregator: Aggregator;
  private foreignBuffers: CollectionBuffers;

  public constructor(
    pipeline: Document[],
    private documentAccess: DocumentAccess,
    private options: AggregatorOptions,
    private logger: Logger)
  {
    super(pipeline);
    this.foreignBuffers = new CollectionBuffers(documentAccess);
    this.aggregator = new Aggregator(pipeline, {
      collectionResolver: coll => {
        if (options.queryAnalysis) {
          return this.foreignBuffers.get({db: options.queryAnalysis.ns.db, coll});
        }
        throw Error('cound not resolve collection');
      }
    });
  }

  public async *stream<TResult>(input: AsyncIterable<Document>): AsyncGenerator<TResult> {
    let mergeInit: Document[] = [];
    const mergeNs = this.options.queryAnalysis?.merge;

    if (this.options.queryAnalysis) {
      for (const ns of this.options.queryAnalysis.foreignInputs) {
        await this.foreignBuffers.load(ns);
      }
      if (mergeNs) {
        mergeInit = cloneDeep(this.foreignBuffers.get(mergeNs)) as Document[];
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

    if (mergeNs) {
      const cs = new ChangeSet(this.foreignBuffers.get(mergeNs), mergeInit);
      const changes = cs.toChanges(mergeNs) as ChangeStreamDocument[];
      await this.documentAccess.write(changes, {ordered: true});
    }
  }
}
