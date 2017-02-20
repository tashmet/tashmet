import {inject, service, Activator, Provider} from '@samizdatjs/tiamat';
import {Collection, Cache, Serializer} from '../content/interfaces';
import {FileSystem, DirectoryConfig} from './interfaces';
import {EventEmitter}  from 'events';
import {basename, dirname, join} from 'path';

export function directory(config: DirectoryConfig): any {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:service', {
      name: config.name,
      singleton: true,
      activator: 'tashmetu.DirectoryCollectionActivator'
    }, target);
    Reflect.defineMetadata('tashmetu:directory', config, target);
  };
}

@service({
  name: 'tashmetu.DirectoryCollectionActivator',
  singleton: true
})
export class DirectoryCollectionActivator
  implements Activator<DirectoryCollection>
{
  @inject('tiamat.Provider') private provider: Provider;
  @inject('tashmetu.Cache') private cache: Cache;
  @inject('tashmetu.FileSystem') private fileSys: FileSystem;

  public activate(obj: DirectoryCollection): any {
    let config = Reflect.getOwnMetadata('tashmetu:directory', obj.constructor);
    let serializer = config.serializer(this.provider);
    let cache = this.cache.createCollection(config.name);
    obj.setSerializer(serializer);
    obj.setCache(cache);
    obj.setFileSystem(this.fileSys);
    return obj;
  }
}

export class DirectoryCollection extends EventEmitter implements Collection {
  private cache: Collection;
  private serializer: Serializer;
  private storing = '';
  private config: DirectoryConfig;
  private fileSys: FileSystem;

  public constructor() {
    super();
    this.config = Reflect.getOwnMetadata('tashmetu:directory', this.constructor);
  }

  public upsert(doc: any, cb: () => void): void {
    this.storing = this.getPath(doc._id);
    this.cache.upsert(doc, () => {
      this.fileSys.write(this.serializer.serialize(doc), this.storing);
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
    fileSys.readdir(this.config.path).forEach((name: string) => {
      let doc = this.loadPath(join(this.config.path, name));
      this.cache.upsert(doc, () => {
        this.emit('document-upserted', doc);
      });
    });
    this.fileSys = fileSys;
  }

  private update(path: string): void {
    if (this.storing !== path) {
      if (this.getCollectionName(path) === this.config.name) {
        let doc = this.loadPath(path);
        this.cache.upsert(doc, () => {
          return;
        });
      }
    } else {
      this.storing = '';
    }
  }

  private loadPath(path: string): any {
    let doc: any = this.serializer.parse(this.fileSys.read(path));
    doc._id = basename(path).split('.')[0];
    return doc;
  }

  private getPath(id: string): string {
    return join(this.config.name, id) + '.' + this.config.extension;
  }

  private getId(path: string): string {
    return basename(path).split('.')[0];
  }

  private getCollectionName(path: string): string {
    return basename(dirname(path));
  }
}
