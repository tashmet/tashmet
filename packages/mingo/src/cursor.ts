import {Query as MingoQuery} from 'mingo/query';
import * as mingoCursor from 'mingo/cursor';
import {
  Cursor,
  Filter,
  FindOptions,
  SortingKey,
  SortingDirection,
  applyFindOptions,
  sortingMap,
  AbstractCursor,
} from '@tashmet/tashmet';


export class MingoCursor<T> extends AbstractCursor<T> implements Cursor<T> {
  private cursor: mingoCursor.Cursor;

  public constructor(
    private collection: any[],
    filter: Filter<T> = {},
    options: FindOptions = {},
  ) {
    super(filter, options);
    this.setData(collection);
  }

  public setData(data: Document[]) {
    this.collection = data;
    this.cursor = new MingoQuery(this.filter, {collation: this.options.collation})
      .find(this.collection, this.options.projection);
    applyFindOptions(this, this.options);
  }

  public sort(key: SortingKey, direction?: SortingDirection): Cursor<T> {
    this.cursor.sort(sortingMap(key, direction));
    return super.sort(key, direction);
  }

  public skip(count: number): Cursor<T> {
    this.cursor.skip(count);
    return super.skip(count);
  }

  public limit(count: number): Cursor<T> {
    this.cursor.limit(count);
    return super.limit(count);
  }

  public async next(): Promise<T | null> {
    return this.cursor.next() as any || null;
  }

  public async hasNext(): Promise<boolean> {
    return this.cursor.hasNext();
  }

  public async forEach(iterator: (doc: T) => void): Promise<void> {
    return this.cursor.forEach(iterator);
  }

  public async toArray(): Promise<T[]> {
    return this.cursor.all() as any;
  }

  public async count(applySkipLimit = true): Promise<number> {
    return applySkipLimit
      ? this.cursor.count()
      : new MingoQuery(this.filter).find(this.collection).count();
  }
}
