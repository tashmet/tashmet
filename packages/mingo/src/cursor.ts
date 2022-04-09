import {Query as MingoQuery} from 'mingo/query';
import {
  Cursor,
  Filter,
  FindOptions,
  AbstractCursor,
} from '@tashmet/tashmet';
import { MingoConfig } from './interfaces';


export class MingoCursor<T> extends AbstractCursor<T> implements Cursor<T> {
  public constructor(
    private collection: any[],
    filter: Filter<T> = {},
    options: FindOptions & MingoConfig = {},
  ) {
    super(filter, options);
    this.setData(collection);
  }

  public setData(data: Document[]) {
    this.collection = data;
  }

  public async fetchAll(): Promise<T[]> {
    const cursor = new MingoQuery(this.filter, this.options)
      .find(this.collection, this.options.projection);
    const {skip, limit, sort} = this.options;

    if (sort) cursor.sort(sort);
    if (skip !== undefined) cursor.skip(skip);
    if (limit !== undefined) cursor.limit(limit);

    return cursor.all() as T[];
  }
}
