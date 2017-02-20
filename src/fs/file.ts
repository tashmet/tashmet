import {inject, service, Activator, Provider} from '@samizdatjs/tiamat';
import {Collection, Cache, Serializer} from '../content';
import {FileSystem, FileConfig} from './interfaces';
import {EventEmitter} from 'events';
import * as _ from 'lodash';

export function file(config: FileConfig): any {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:service', {
      name: config.name,
      singleton: true,
      activator: 'tashmetu.FileCollectionActivator'
    }, target);
    Reflect.defineMetadata('tashmetu:file', config, target);
  };
}

@service({
  name: 'tashmetu.FileCollectionActivator',
  singleton: true
})
export class FileCollectionActivator
  implements Activator<FileCollection>
{
  @inject('tiamat.Provider') private provider: Provider;
  @inject('tashmetu.Cache') private cache: Cache;
  @inject('tashmetu.FileSystem') private fileSys: FileSystem;

  public activate(obj: FileCollection): any {
    let config = Reflect.getOwnMetadata('tashmetu:file', obj.constructor);
    let serializer = config.serializer(this.provider);
    let cache = this.cache.createCollection(config.name);
    obj.setSerializer(serializer);
    obj.setCache(cache);
    obj.setFileSystem(this.fileSys);
    return obj;
  }
}

export class FileCollection extends EventEmitter implements Collection {
  private storing = false;
  private cache: Collection;
  private serializer: Serializer;
  private config: FileConfig;
  private fileSys: FileSystem;

  public constructor() {
    super();
    this.config = Reflect.getOwnMetadata('tashmetu:file', this.constructor);
  }

  public upsert(doc: any, cb: () => void): void {
    this.storing = true;
    this.cache.upsert(doc, () => {
      this.cache.find({}, {}, (docs: any) => {
        let dict = _.transform(docs, (result: any, obj: any) => {
          result[doc._id] = obj;
        }, {});
        this.fileSys.write(this.serializer.serialize(dict), this.config.path);
      });
    });
  }

  public find(filter: any, options: any, fn: (result: any) => void): void {
    this.cache.find(filter, options, fn);
  }

  public findOne(filter: Object, options: Object, fn: (result: any) => void): void {
    this.cache.findOne(filter, options, fn);
  }

  public name(): string {
    return this.config.name;
  }

  public setSerializer(serializer: Serializer): void {
    this.serializer = serializer;
  }

  public setCache(cache: Collection): void {
    const events = [
      'document-upserted',
      'document-removed'
    ];
    events.forEach((event: string) => {
      cache.on(event, (obj: any) => {
        this.emit(event, obj);
      });
    });
    this.cache = cache;
  }

  public setFileSystem(fileSys: FileSystem): void {
    fileSys.on('file-added', (path: string) => {
      this.update(path);
    });
    fileSys.on('file-changed', (path: string) => {
      this.update(path);
    });
    fileSys.on('file-removed', (path: string) => {
      // TODO: Remove document from cache.
      return;
    });
    fileSys.on('ready', () => {
      this.emit('ready');
    });
    this.fileSys = fileSys;
    this.update(this.config.path);
  }

  private readFile(): Object {
    try {
      return this.serializer.parse(this.fileSys.read(this.config.path));
    } catch (e) {
      return {};
    }
  }

  private update(path: string): void {
    if (path === this.config.path) {
      if (!this.storing) {
        let dict = this.readFile();
        _.each(dict, (doc: any, id: string) => {
          doc._id = id;
          this.cache.upsert(doc, () => {
            return;
          });
        });
      } else {
        this.storing = false;
      }
    }
  }
}
