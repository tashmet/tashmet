import {EventEmitter} from 'eventemitter3';
import {cloneDeep, difference, each, intersection, isEqual, keys, omit, transform} from 'lodash';
import {PersistenceAdapter, ObjectMap, Channel} from '../interfaces';

export class Bundle extends EventEmitter implements PersistenceAdapter {
  private buffer: ObjectMap = {};

  public constructor(private source: Channel) {
    super();
    source.on('data-updated', data => this.onSourceUpdated(data));
  }

  public toString(): string {
    return `bundle using ${this.source.toString()}`
  }

  public async read(): Promise<ObjectMap> {
    try {
      return this.set(await this.source.read());
    } catch (err) {
      return this.set({});
    }
  }

  public async write(docs: any[]): Promise<void> {
    await this.read();
    for (const doc of docs) {
      if (doc._id === undefined) {
        throw Error('failed trying to bundle document without ID');
      }
      this.buffer[doc._id] = omit(doc, ['_id']);
    }
    return this.flush();
  }

  public async remove(ids: string[]): Promise<void> {
    await this.read();
    for (const id of ids) {
      delete this.buffer[id];
    }
    return this.flush();
  }

  private async flush(): Promise<void> {
    return this.source.write(this.buffer);
  }

  private async onSourceUpdated(data: any) {
    const old = this.buffer;
    this.set(data);
    each(Object.keys(old).length === 0 ? data : this.updated(old), (doc, id) => {
      this.emit('document-updated', id, doc);
    });
    for (const id of this.removed(old)) {
      this.emit('document-removed', id);
    }
  }

  private updated(other: ObjectMap): ObjectMap {
    return transform(intersection(keys(this.buffer), keys(other)), (result: ObjectMap, id: string) => {
      if (!isEqual(this.buffer[id], other[id])) {
        result[id] = this.buffer[id];
      }
      return result;
    }, {});
  }

  private removed(other: ObjectMap): string[] {
    return difference(keys(other), keys(this.buffer));
  }

  private set(obj: ObjectMap): ObjectMap {
    this.buffer = cloneDeep(obj);
    return obj;
  }
}
