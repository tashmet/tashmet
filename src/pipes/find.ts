import {Pipe, PipeFunction, Component, callable, step} from '@ziggurat/ningal';
import {Collection, CacheQuery, Query, QueryOptions} from '../interfaces';
import {Document} from '../models/document';
import {cloneDeep} from 'lodash';

export class CacheFindError extends Error {
  public constructor(
    public selector: Object,
    public options: QueryOptions
  ) {
    super('Query not cached');
  }
}

export class FindPipe extends Component<Query, Document[]> {
  @step('cache') private upsertCache: PipeFunction<Document>;
  @step('validate') private validate: PipeFunction<Document>;

  public constructor(
    private source: Collection,
    private cache: Collection,
    cachePipe: Pipe<Document>,
    validationPipe: Pipe<Document>
  ) {
    super();
    this.upsertCache = callable(cachePipe);
    this.validate = callable(validationPipe);
  }

  public async process(q: Query): Promise<Document[]> {
    try {
      return await this.queryCache({
        selector: cloneDeep(q.selector || {}),
        options: cloneDeep(q.options || {}),
        cached: false
      });
    } catch (err) {
      const query: Query = {selector: err.selector, options: err.options};
      for (let doc of await(this.querySource(query))) {
        await this.upsertCache(await this.validate(doc));
      }
      return this.cache.find(q.selector, q.options);
    }
  }

  @step('cache-query')
  private async queryCache(q: CacheQuery): Promise<Document[]> {
    if (q.cached) {
      return this.cache.find(q.selector, q.options);
    } else {
      throw new CacheFindError(q.selector, q.options);
    }
  }

  @step('source-query')
  private async querySource(q: Query): Promise<Document[]> {
    return this.source.find(q.selector, q.options);
  }
}

export class FindOnePipe extends Component<object, Document> {
  @step('cache') private upsertCache: PipeFunction<Document>;
  @step('validate') private validate: PipeFunction<Document>;

  public constructor(
    private source: Collection,
    private cache: Collection,
    cachePipe: Pipe<Document>,
    validationPipe: Pipe<Document>
  ) {
    super();
    this.upsertCache = callable(cachePipe);
    this.validate = callable(validationPipe);
  }

  public async process(selector: object): Promise<Document> {
    try {
      return await this.cache.findOne(selector);
    } catch (err) {
      let doc = await this.source.findOne(selector);
      return await this.upsertCache(await this.validate(doc));
    }
  }
}
