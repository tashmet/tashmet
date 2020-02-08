import {View} from './view';
import {makeCursor} from './query';

/**
 * A view monitoring a single document.
 */
export abstract class Item<T = any> extends View<T> {
  protected _data: T | null;
  public readonly limit = 1;

  /**
   * The document in this view.
   */
  public get data(): T | null {
    return this._data;
  }

  public async refresh(): Promise<T | null> {
    const result = await makeCursor(this, this.collection).toArray();
    this._data = result.length > 0 ? result[0] : null;
    this.emit('item-updated', this._data);
    return this._data;
  }

  public on(event: 'item-updated', fn: (doc: T) => void) {
    return super.on(event, fn);
  }
}
