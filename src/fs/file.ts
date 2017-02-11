import {Provider} from '@samizdatjs/tiamat';
import {Serializer, Stream, StreamProvider} from '../content';
import {FileSystem, FileConfig} from './interfaces';
import {EventEmitter} from 'events';
import {DictionaryStream} from '../content/persistence/dictionary';

export class FileProvider implements StreamProvider {
  public constructor(private config: FileConfig) {};

  public createStream(serializer: Serializer, provider: Provider): Stream<Object> {
    return new DictionaryStream(new FileStream(
      serializer,
      provider.get<FileSystem>('tashmetu.FileSystem'),
      this.config
    ));
  }
}

class FileStream extends EventEmitter implements Stream<Object> {
  private storing = false;

  public constructor(
    private serializer: Serializer,
    private fileSys: FileSystem,
    private config: FileConfig
  ) {
    super();
    this.fileSys.on('file-added', (path: string) => {
      this.update('document-added', path);
    });
    this.fileSys.on('file-changed', (path: string) => {
      this.update('document-changed', path);
    });
    this.fileSys.on('file-removed', (path: string) => {
      if (path === this.config.name) {
        this.emit('document-removed', path.split('.')[0]);
      }
    });
    this.fileSys.on('ready', () => {
      this.emit('ready');
    });
  }

  public read(id?: string): Object {
    try {
      return this.serializer.parse(this.fileSys.read(this.config.name));
    } catch (e) {
      return {};
    }
  }

  public write(data: Object): void {
    this.storing = true;
    this.fileSys.write(this.serializer.serialize(data), this.config.name);
  }

  private update(event: string, path: string): void {
    if (path === this.config.name) {
      if (!this.storing) {
        this.emit(event, this.read());
      } else {
        this.storing = false;
      }
    }
  }
}
