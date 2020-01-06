import {View} from './view';

/**
 * A view monitoring a list of documents.
 */
export abstract class ItemSet<T = any> extends View<T[]> {
  protected _data: T[] = [];
  private _totalCount = 0;

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
    const query = this.query();

    this._data = await this.collection.find<T>(query.selector, query.options);
    this._totalCount = await this.collection.count(query.selector);
    this.emit('item-set-updated', this._data, this._totalCount);
    return this._data;
  }

  public on(event: 'item-set-updated', fn: (data: T[], totalCount: number) => void) {
    return super.on(event, fn);
  }
}
