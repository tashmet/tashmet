import {Collection, CollectionFactory, Database} from '@ziqquratu/ziqquratu';
import {FileConfig} from '../interfaces';
import {buffer} from './buffer';
import {FileStreamFactory, dict, ObjectPipeTransformFactory} from '../pipes';

export class FileBufferFactory extends CollectionFactory {
  constructor(private config: FileConfig) {
    super('nabu.FileSystemConfig', 'chokidar.FSWatcher');
  }

  public create(name: string, database: Database): Promise<Collection> {
    const transforms: ObjectPipeTransformFactory[] = [this.config.serializer];
    if (this.config.dictionary) {
      transforms.push(dict());
    }
    const streamFactory = new FileStreamFactory(this.config.path, transforms);

    return buffer({stream: streamFactory, bundle: true}).create(name, database);
  }
}

export const file = (config: FileConfig) => new FileBufferFactory(config);
