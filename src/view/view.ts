import {injectable} from '@ziggurat/tiamat';
import {QueryOptions} from '../interfaces';
import {Filter} from './interfaces';
import {EventEmitter} from 'eventemitter3';
import {Controller} from '../database/controller';
import {Document} from '../models/document';
import {each, find} from 'lodash';

@injectable()
export class View<T extends Document = Document> extends EventEmitter {
  private _selector: any = {};
  private _options: QueryOptions = {};
  private _data: T[] = [];
  private filters: Filter[] = [];

  public constructor(
    private controller: Controller
  ) {
    super();

    this.on('data-updated', (results: T[], totalCount: number) => {
      this._data = results;
    });

    controller.on('document-upserted', (doc: any) => {
      this.onDocumentUpdated(doc);
    });
    controller.on('document-removed', (doc: any) => {
      this.onDocumentUpdated(doc);
    });
  }

  public addFilter(filter: Filter): View<T> {
    this.filters.push(filter);
    filter.on('filter-changed', () => {
      this.refresh();
    });
    this.applyFilters();
    return this;
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

  public async refresh(): Promise<T[]> {
    this.applyFilters();

    let docs = await this.controller.find<T>(this.selector, this.options);
    let totalCount = await this.controller.count(this.selector);
    this.emit('data-updated', docs, totalCount);
    return docs;
  }

  private applyFilters() {
    this._selector = {};
    this._options = {};

    each(this.filters, (f: Filter) => {
      f.apply(this.selector, this.options);
    });
  }

  private onDocumentUpdated(doc: T) {
    this.controller.cache.find(this.selector, this.options)
      .then((documents: any[]) => {
        if (find(documents, ['_id', doc._id])) {
          this.emit('data-updated', documents, 1);
        }
      });
  }
}
