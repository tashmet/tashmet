import {Pipe, PipeFunction, Component, callable, step} from '@ziggurat/ningal';
import {Collection, CacheQuery, Query, QueryOptions} from '../interfaces';
import cloneDeep from 'lodash/cloneDeep';

export class CacheFindError extends Error {
  public constructor(
    public selector: Object,
    public options: QueryOptions
  ) {
    super('Query not cached');
  }
}

export class FindPipe<T> extends Component<Query, T[]> {
  @step('cache') private upsertCache: PipeFunction<any>;
  @step('validate') private validate: PipeFunction<any>;

  public constructor(
    private source: Collection,
    private cache: Collection,
    cachePipe: Pipe<T>,
    validationPipe: Pipe<T>
  ) {
    super();
    this.upsertCache = callable(cachePipe);
    this.validate = callable(validationPipe);
  }

  public async process(q: Query): Promise<T[]> {
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
  private async queryCache(q: CacheQuery): Promise<T[]> {
    if (q.cached) {
      return this.cache.find(q.selector, q.options);
    } else {
      throw new CacheFindError(q.selector, q.options);
    }
  }

  @step('source-query')
  private async querySource(q: Query): Promise<T[]> {
    return this.source.find(q.selector, q.options);
  }
}

export class FindOnePipe<T> extends Component<object, T> {
  @step('cache') private upsertCache: PipeFunction<T>;
  @step('validate') private validate: PipeFunction<T>;

  public constructor(
    private source: Collection,
    private cache: Collection,
    cachePipe: Pipe<T>,
    validationPipe: Pipe<T>
  ) {
    super();
    this.upsertCache = callable(cachePipe);
    this.validate = callable(validationPipe);
  }

  public async process(selector: object): Promise<T> {
    try {
      return await this.cache.findOne(selector);
    } catch (err) {
      let doc = await this.source.findOne(selector);
      return await this.upsertCache(await this.validate(doc));
    }
  }
}
