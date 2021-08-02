import {View} from './view';
import {bindQuery, ResultSet} from './query';

/**
 * A view monitoring a list of documents.
 */
export abstract class ItemSet<T = any> extends View<T> implements ResultSet<T> {
  protected resultSet: ResultSet<T>;

  /**
   * List of documents in this view.
   */
  public get data(): T[] {
    return this.resultSet.data;
  }

  /**
   * The total number of documents matching the view's selector, disregarding its query options.
   */
  public get totalCount(): number {
    return this.resultSet.totalCount;
  }

  /**
   * The number of documents excluded from the view based on its query options.
   */
  public get excludedCount(): number {
    return this.resultSet.excludedCount;
  }

  public async refresh(): Promise<T[]> {
    this.resultSet = await bindQuery(this, await this.collection).many();
    this.emit('item-set-updated', this);
    return this.data;
  }

  public on(event: 'item-set-updated', fn: (resultSet: ResultSet<T>) => void) {
    return super.on(event, fn);
  }
}
