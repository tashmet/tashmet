import {injectable} from '@ziggurat/tiamat';
import {QueryOptions} from '../interfaces';
import {Filter} from './interfaces';
import {EventEmitter} from 'eventemitter3';
import {Document} from '../models/document';
import {each} from 'lodash';
import * as Promise from 'bluebird';

@injectable()
export class View<T extends Document = Document> extends EventEmitter {
  private _selector: any = {};
  private _options: QueryOptions = {};
  private _data: T[] = [];
  private filters: {[name: string]: any} = {};

  public constructor() {
    super();

    this.on('data-updated', (results: T[], totalCount: number) => {
      this._data = results;
    });
  }

  public get selector(): any {
    return this._selector;
  }

  public get options(): QueryOptions {
    return this._options;
  }

  public get data(): T[] {
    return this._data;
  }

  public addFilter(name: string, provider: Function): View<T> {
    this.filters[name] = provider(this);
    this.filters[name].on('filter-changed', () => {
      this.refresh();
    });
    this.applyFilters();
    return this;
  }

  public filter<U>(name: string): U {
    return <U>(this.filters[name]);
  }

  public refresh(): View<T> {
    this.applyFilters();
    this.emit('refresh');
    return this;
  }

  private applyFilters() {
    this._selector = {};
    this._options = {};

    each(this.filters, (f: Filter) => {
      f.apply(this.selector, this.options);
    });
  }
}
