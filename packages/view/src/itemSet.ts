import {View} from './view';
import {makeCursor} from './query';

/**
 * A view monitoring a list of documents.
 */
export abstract class ItemSet<T = any> extends View<T> {
  protected _data: T[] = [];
  private _totalCount = 0;

  /**
   * List of documents in this view.
   */
  public get data(): T[] {
    return this._data;
  }

  /**
   * The total number of documents matching the view's selector, disregarding its query options.
   */
  public get totalCount(): number {
    return this._totalCount;
  }

  /**
   * The number of documents excluded from the view based on its query options.
   */
  public get excludedCount(): number {
    return this.totalCount - this.data.length;
  }

  public async refresh(): Promise<T[]> {
    this._data = await makeCursor<T>(this, this.collection).toArray();
    this._totalCount = await makeCursor<T>(this, this.collection).count(false);
    this.emit('item-set-updated', this._data, this._totalCount);
    return this._data;
  }

  public on(event: 'item-set-updated', fn: (data: T[], totalCount: number) => void) {
    return super.on(event, fn);
  }
}
