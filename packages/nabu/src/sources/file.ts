/*import {FSWatcher} from 'chokidar';
import {Collection, CollectionFactory, MemoryCollection, Database} from '@ziqquratu/ziqquratu';
import {PersistenceCollection} from '../collections/persistence';
import {File} from '../channels/file';
import {FileConfig, FileSystemConfig} from '../interfaces';
import {Bundle} from './bundle';

export class FileCollectionFactory extends CollectionFactory {
  constructor(private config: FileConfig) {
    super('nabu.FileSystemConfig', 'chokidar.FSWatcher');
  }

  public create(name: string, database: Database): Promise<Collection> {
    return this.resolve(async (fsConfig: FileSystemConfig, watcher: FSWatcher) => {
      return new PersistenceCollection(
        new Bundle(
          new File(
            this.config.serializer.create(),
            this.config.path,
            fsConfig.watch ? watcher : undefined
          )
        ),
        new MemoryCollection(name, database, {disableEvents: true})
      ).populate();
    });
  }
}

export const file = (config: FileConfig) => new FileCollectionFactory(config);
*/
