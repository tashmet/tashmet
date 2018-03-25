import {getType} from 'reflect-helper';
import {activate, injectable, inject, Injector} from '@ziggurat/tiamat';
import {QueryOptions} from '../interfaces';
import {Filter} from './interfaces';
import {EventEmitter} from 'eventemitter3';
import {Controller} from '../database/controller';
import {Document} from '../models/document';
import {each, find, includes} from 'lodash';
import {ViewOfAnnotation} from './decorators';

@injectable()
export class View<T extends Document = Document> extends EventEmitter {
  private controller: Controller;
  private _selector: any = {};
  private _options: QueryOptions = {};
  private _data: T[] = [];
  private filters: Filter[] = [];

  public filter<F extends Filter>(filter: F): F {
    let proxy = new Proxy(filter, {
      set: (target: any, key: PropertyKey, value: any, reciever: any): boolean => {
        let toggleDirty = key === 'dirty' && value === true && !filter.dirty;
        target[key] = value;
        if (toggleDirty || includes(filter.observe, key)) {
          this.refresh();
        }
        return true;
      }
    });
    this.filters.push(proxy);
    this.applyFilters();
    return proxy;
  }

  public get collection(): Controller {
    return this.controller;
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
    this.applyFilters(true);

    let docs = await this.controller.find<T>(this.selector, this.options);
    let totalCount = await this.controller.count(this.selector);
    this.emit('data-updated', docs, totalCount);
    return docs;
  }

  public setCollection(controller: Controller) {
    this.controller = controller;
    this.on('data-updated', (results: T[]) => {
      this._data = results;
    });

    controller.on('document-upserted', (doc: any) => {
      this.documentUpdated(doc);
    });
    controller.on('document-removed', (doc: any) => {
      this.documentUpdated(doc);
    });
  }

  private applyFilters(resetDirty = false) {
    this._selector = {};
    this._options = {};

    each(this.filters, (f: Filter) => {
      f.apply(this.selector, this.options);
      if (resetDirty) {
        f.dirty = false;
      }
    });
  }

  private async documentUpdated(doc: T) {
    if (doc._collection !== this.controller.name) {
      return;
    }
    this.applyFilters();
    let docs = await this.controller.cache.find<any>(this.selector, this.options);
    if (find(docs, ['_id', doc._id])) {
      this.emit('data-updated', docs);
    }
  }
}
