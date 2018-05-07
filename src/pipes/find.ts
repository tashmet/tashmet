import {Pipe, PipeFunction, Execution, Component, callable, step} from '@ziggurat/ningal';
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
    this.validate = callable(cachePipe);
  }

  public async process(q: Query, exec: Execution<any>): Promise<Document[]> {
    try {
      return await this.queryCache({
        selector: cloneDeep(q.selector || {}),
        options: cloneDeep(q.options || {}),
        cached: false
      }, exec);
    } catch (err) {
      const query: Query = {selector: err.instance.selector, options: err.instance.options};
      for (let doc of await(this.querySource(query, exec))) {
        await this.upsertCache(await this.validate(doc, exec), exec);
      }
      return this.cache.find(q.selector, q.options);
    }
  }

  @step('cache-query')
  private async queryCache(q: CacheQuery, exec: Execution<Document[]>): Promise<Document[]> {
    if (q.cached) {
      return this.cache.find(q.selector, q.options);
    } else {
      throw new CacheFindError(q.selector, q.options);
    }
  }

  @step('source-query')
  private async querySource(q: Query, exec: Execution<Document[]>): Promise<Document[]> {
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
    this.validate = callable(cachePipe);
  }

  public async process(selector: object, exec: Execution<any>): Promise<Document> {
    try {
      return await this.cache.findOne(selector);
    } catch (err) {
      let doc = await this.source.findOne(selector);
      return await this.upsertCache(await this.validate(doc, exec), exec);
    }
  }
}
