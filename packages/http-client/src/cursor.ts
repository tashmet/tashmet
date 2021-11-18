import {AbstractCursor, Filter, QueryOptions} from '@tashmit/database';
import {QuerySerializer} from '@tashmit/qs-builder';
import {HttpRestLayer} from './common';

export class HttpCollectionCursor<T = any> extends AbstractCursor<T> {
  public constructor(
    private restLayer: HttpRestLayer,
    private querySerializer: QuerySerializer,
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
    const options = applySkipLimit ? this.options : {};
    const resp = await this.query(this.filter, options, true);
    const totalCount = resp.headers.get('x-total-count');
    if (!totalCount) {
      throw new Error('failed to get "x-total-count" header');
    }
    return parseInt(totalCount, 10);
  }

  private query(filter?: Filter<T>, options?: QueryOptions, head?: boolean): Promise<Response> {
    return this.restLayer.get(this.querySerializer.serialize({filter, ...options}), head);
  }
}
