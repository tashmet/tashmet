import {View} from './view';

/**
 * A view monitoring a single document.
 */
export abstract class Item<T = any> extends View<T> {
  public readonly limit = 1;

  public async refresh(): Promise<T> {
    const result = await this.query.cursor.toArray();
    this._data = result.length > 0 ? result[0] : undefined;
    this.emit('item-updated', this._data);
    return this._data;
  }

  public on(event: 'item-updated', fn: (doc: T) => void) {
    return super.on(event, fn);
  }
}
