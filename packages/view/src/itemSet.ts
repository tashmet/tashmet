import {View} from './view';
import {Tracker} from './interfaces';

/**
 * A view monitoring a list of documents.
 */
export abstract class ItemSet<T = any> extends View<T> {
  protected _matchingCount: number = 0;
  protected _data: T[] = [];

  public constructor(tracker: Tracker) {
    super(tracker);
    this.tracker.on('result-set', (data, matchingCount) => {
      this._data = data;
      this._matchingCount = matchingCount;
    });
  }

  /**
   * List of documents in this view.
   */
  public get data(): T[] {
    return this._data;
  }

  /**
   * The total number of documents matching the view's selector, disregarding its query options.
   */
  public get matchingCount(): number {
    return this._matchingCount;
  }

  public async refresh(): Promise<T[]> {
    return await this.tracker.refresh();
  }

  public on(event: 'item-set-updated', fn: (data: T[], matchingCount: number) => void) {
    return this.tracker.on('result-set', fn);
  }
}
