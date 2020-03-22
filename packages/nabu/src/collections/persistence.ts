import {Collection, Cursor, ReplaceOneOptions, QueryOptions} from '@ziqquratu/ziqquratu';
import {PersistenceAdapter, ObjectMap} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import {merge} from 'lodash';

export class PersistenceCollection extends EventEmitter implements Collection {
  public constructor(
    private adapter: PersistenceAdapter,
    private cache: Collection,
  ) {
    super();
    cache.on('document-upserted', (doc: Document) => {
      this.emit('document-upserted', doc);
    });
    cache.on('document-removed', (doc: Document) => {
      this.emit('document-removed', doc);
    });
    adapter.on('document-updated', (id: string, data: any) => {
      this.load(id, data);
    });
    adapter.on('document-removed', (id: string) => {
      cache.deleteOne({_id: id});
    });
  }

  public toString(): string {
    return `persistence collection '${this.name}' using ${this.adapter.toString()}`;
  }

  public async insertOne(doc: any): Promise<any> {
    const res = await this.cache.insertOne(doc);
    await this.adapter.write([res]);
    return res;
  }
  
  public async insertMany(docs: any[]): Promise<any[]> {
    const res = await this.cache.insertMany(docs);
    await this.adapter.write(docs);
    return res;
  }
  
  public async replaceOne(selector: object, doc: any, options: ReplaceOneOptions = {}): Promise<any> {
    const old = await this.cache.findOne(selector);
    if (old) {
      if (doc._id && doc._id !== old._id) {
        await this.adapter.remove([old._id]);
      }
      await this.adapter.write([Object.assign({}, {_id: old._id}, doc)]);
      return this.cache.replaceOne(selector, doc, options);
    } else if (options.upsert) {
      return this.insertOne(doc);
    }
    return null;
  }

  public find(selector?: object, options?: QueryOptions): Cursor<any> {
    return this.cache.find(selector, options);
  }

  public async findOne(selector: any): Promise<any> {
    return this.cache.findOne(selector);
  }

  public async deleteOne(selector: any): Promise<any> {
    const affected = await this.cache.deleteOne(selector);
    if (affected) {
      await this.adapter.remove([affected._id]);
    }
    return affected;
  }

  public async deleteMany(selector: any): Promise<any[]> {
    const affected = await this.cache.deleteMany(selector);
    await this.adapter.remove(affected.map(d => d._id));
    return affected;
  }

  public async populate(): Promise<Collection> {
    const data: ObjectMap = await this.adapter.read();
    for (const id of Object.keys(data)) {
      await this.load(id, data[id]);
    }
    return this;
  }

  public get name(): string {
    return this.cache.name;
  }

  private async load(id: string, doc: Record<string, any>): Promise<any> {
    return this.cache.replaceOne({_id: id}, merge({}, doc, {_id: id}), {upsert: true});
  }
}
