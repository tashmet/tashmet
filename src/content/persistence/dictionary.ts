import {Stream} from '../interfaces';
import {EventEmitter} from 'events';
import * as _ from 'lodash';

export class DictionaryStream extends EventEmitter implements Stream<Object> {
  private dict: any;

  public constructor(private stream: Stream<Object>) {
    super();
    stream.on('document-added', (doc: any) => {
      this.update('document-added', doc);
    });
    stream.on('document-changed', (doc: any) => {
      this.update('document-changed', doc);
    });
    stream.on('document-removed', (id: string) => {
      let dict = this.dict;
      this.dict = {};
      for (let key in dict) {
        if (dict[key]) {
          this.emit('document-removed', key);
        }
      }
    });
    stream.on('ready', () => {
      this.emit('ready');
    });
  }

  public read(id?: string): Object {
    return this.stream.read(id);
  }

  public write(obj: any): void {
    this.dict = this.dict || this.read();
    this.dict[obj._id] = this.strip(obj);
    this.stream.write(this.dict);
  }

  private update(event: string, doc: any): void {
    for (let key in doc) {
      if (doc[key]) {
        let obj = doc[key];
        obj._id = key;
        this.emit(event, obj);
      }
    }
    this.dict = doc;
  }

  private strip(obj: any): any {
    let metaKeys = _.filter(Object.keys(obj), function(value) {
      return _.startsWith(value, '_');
    });
    return _.omit(obj, metaKeys);
  }
}
