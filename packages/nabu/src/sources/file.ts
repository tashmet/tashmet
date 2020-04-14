import {FSWatcher} from 'chokidar';
import {EventEmitter} from 'eventemitter3';
import {cloneDeep, difference, each, intersection, isEqual, keys, omit, transform} from 'lodash';
import * as fs from 'fs-extra';
import {Collection, CollectionFactory, MemoryCollection, Database} from '@ziqquratu/ziqquratu';
import {PersistenceCollection} from '../collections/persistence';
import {
  FileConfig, FileSystemConfig, PersistenceAdapter, ObjectMap, Serializer
} from '../interfaces';

export class File extends EventEmitter implements PersistenceAdapter {
  private buffer: ObjectMap = {};

  public constructor(
    private serializer: Serializer,
    private path: string,
    watcher?: FSWatcher
  ) {
    super();
    if (watcher) {
      watcher
        .on('add',    filePath => this.onFileAdded(filePath))
        .on('change', filePath => this.onFileChanged(filePath))
        .add(path);
    }
  }

  public toString(): string {
    return `file '${this.path}'`;
  }

  public async read(): Promise<ObjectMap> {
    try {
      const buffer = await fs.readFile(this.path);
      return this.set(await this.serializer.deserialize(buffer) as ObjectMap);
    } catch (err) {
      return this.set({});
    }
  }

  public async write(docs: any[]): Promise<void> {
    await this.read();
    for (const doc of docs) {
      if (doc._id === undefined) {
        throw Error('failed trying to store document without ID');
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
    if (Object.keys(this.buffer).length === 0) {
      return fs.unlinkSync(this.path);
    }
    return fs.writeFile(this.path, await this.serializer.serialize(this.buffer));
  }

  private async onFileAdded(path: string) {
    if (path === this.path) {
      each(await this.read(), (doc, id) => {
        this.emit('document-updated', id, doc);
      });
    }
  }

  private async onFileChanged(path: string) {
    if (path === this.path) {
      const old = this.buffer;
      await this.read();
      each(this.updated(old), (doc, id) => {
        this.emit('document-updated', id, doc);
      });
      for (const id of this.removed(old)) {
        this.emit('document-removed', id);
      }
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

export class FileCollectionFactory extends CollectionFactory {
  constructor(private config: FileConfig) {
    super('nabu.FileSystemConfig', 'chokidar.FSWatcher');
  }

  public create(name: string, database: Database): Promise<Collection> {
    return this.resolve(async (fsConfig: FileSystemConfig, watcher: FSWatcher) => {
      return new PersistenceCollection(
        new File(
          this.config.serializer.create(),
          this.config.path,
          fsConfig.watch ? watcher : undefined
        ),
        new MemoryCollection(name, database, {disableEvents: true})
      ).populate();
    });
  }
}

export const file = (config: FileConfig) => new FileCollectionFactory(config);
