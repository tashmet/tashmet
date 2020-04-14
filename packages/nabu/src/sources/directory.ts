import {FSWatcher} from 'chokidar';
import {EventEmitter} from 'eventemitter3';
import {omit} from 'lodash';
import {basename, dirname, join} from 'path';
import * as fs from 'fs-extra';
import {Collection, CollectionFactory, MemoryCollection, Database} from '@ziqquratu/ziqquratu';
import {PersistenceCollection} from '../collections/persistence';
import {
  DirectoryConfig, FileSystemConfig, PersistenceAdapter, ObjectMap, Serializer
} from '../interfaces';

export class Directory extends EventEmitter implements PersistenceAdapter {
  public constructor(
    private serializer: Serializer,
    private path: string,
    private extension: string,
    create: boolean,
    watcher?: FSWatcher
  ) {
    super();
    if (watcher) {
      watcher
        .on('add',    filePath => this.onFileUpdated(filePath))
        .on('change', filePath => this.onFileUpdated(filePath))
        .on('unlink', filePath => this.onFileRemoved(filePath))
        .add(path);
    }
    if (!fs.existsSync(path) && create){
      fs.mkdirSync(path);
    }
  }

  public toString(): string {
    return `directory '${this.path}'`;
  }

  public async read(): Promise<ObjectMap> {
    const result: ObjectMap = {};
    for (const file of await fs.readdir(this.path)) {
      result[this.getId(file)] = await this.loadFile(join(this.path, file));
    }
    return result;
  }

  public async write(docs: any[]): Promise<void> {
    for (const doc of docs) {
      const path = join(this.path, `${doc._id}.${this.extension}`);
      await fs.writeFile(path, await this.serializer.serialize(omit(doc, ['_id'])));
    }
  }

  public async remove(ids: string[]): Promise<void> {
    for (const id of ids) {
      await fs.remove(join(this.path, `${id}.${this.extension}`));
    }
  }

  private async loadFile(path: string): Promise<any> {
    return this.serializer.deserialize(await fs.readFile(path));
  }

  private async onFileUpdated(path: string) {
    if (dirname(path) === this.path) {
      this.emit('document-updated', this.getId(path), await this.loadFile(path));
    }
  }

  private onFileRemoved(path: string) {
    if (dirname(path) === this.path) {
      this.emit('document-removed', this.getId(path));
    }
  }

  private getId(path: string): string {
    return basename(path).split('.')[0];
  }
}

export class DirectoryCollectionFactory extends CollectionFactory {
  constructor(private config: DirectoryConfig) {
    super('nabu.FileSystemConfig', 'chokidar.FSWatcher');
  }

  public create(name: string, database: Database): Promise<Collection> {
    return this.resolve(async (fsConfig: FileSystemConfig, watcher: FSWatcher) => {
      return new PersistenceCollection(
        new Directory(
          this.config.serializer.create(),
          this.config.path,
          this.config.extension,
          this.config.create || false,
          fsConfig.watch ? watcher : undefined
        ),
        new MemoryCollection(name, database, {disableEvents: true})
      ).populate();
    });
  }
}

export const directory = (config: DirectoryConfig) => new DirectoryCollectionFactory(config);
