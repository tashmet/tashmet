import {Op} from './decorators/operator';
import {View} from './view';

/**
 * A view monitoring a single document.
 */
export abstract class Item<T = any> extends View<T> {
  protected _data: T | null;

  @Op.$limit public readonly limit = 1;

  /** The document in this view */
  public get data(): T | null {
    return this._data;
  }

  public async refresh(): Promise<T | null> {
    const resultSet = await this.tracker.refresh();
    return this._data = resultSet[0];
  }

  public on(event: 'item-updated', fn: (doc: T | null) => void) {
    return this.tracker.on('result-set', (data) => data[0] || null);
  }
}
