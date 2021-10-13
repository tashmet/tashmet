import {
  AbstractCursor,
  Filter,
  QueryOptions,
} from '@ziqquratu/database';
import {Fetch} from './interfaces';
import {HttpQueryBuilder} from './query';


export class RestCollectionCursor<T = any> extends AbstractCursor<T> {
  public constructor(
    private queryBuilder: HttpQueryBuilder,
    private fetch: Fetch,
    private headers: Record<string, string> = {},
    selector: object = {},
    options: QueryOptions = {},
  ) {
    super(selector, options);
  }

  public async toArray(): Promise<T[]> {
    const resp = await this.query(this.filter, this.options);
    if (!resp.ok) {
      throw new Error('failed to contact server');
    }
    return await resp.json();
  }

  public async count(applySkipLimit = true): Promise<number> {
    const resp = await this.query(this.filter, applySkipLimit ? this.options : {}, {method: 'HEAD'});
    const totalCount = resp.headers.get('x-total-count');
    if (!totalCount) {
      throw new Error('failed to get "x-total-count" header');
    }
    return parseInt(totalCount, 10);
  }

  private query(filter?: Filter<T>, options?: QueryOptions, init?: RequestInit): Promise<Response> {
    return this.fetch(this.queryBuilder.serialize(filter || {}, options || {}),
      Object.assign({}, init, {headers: this.headers}));
  }
}
