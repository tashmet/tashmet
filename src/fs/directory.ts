import {Provider} from '@samizdatjs/tiamat';
import {Serializer, Stream, StreamProvider} from '../content/interfaces';
import {FileSystem, DirectoryConfig} from './interfaces';
import {EventEmitter}  from 'events';
import {basename, dirname, join} from 'path';

export class DirectoryProvider implements StreamProvider {
  public constructor(private config: DirectoryConfig) {};

  public createStream(serializer: Serializer, provider: Provider): Stream<Object> {
    return new DirectoryStream(
      serializer,
      provider.get<FileSystem>('tashmetu.FileSystem'),
      this.config
    );
  }
}

class DirectoryStream extends EventEmitter implements Stream<Object> {
  private storing: string;

  public constructor(
    private serializer: Serializer,
    private fileSys: FileSystem,
    private config: DirectoryConfig,
  ) {
    super();
    this.fileSys.on('file-added', (path: string) => {
      this.update('document-added', path);
    });
    this.fileSys.on('file-changed', (path: string) => {
      this.update('document-changed', path);
    });
    this.fileSys.on('file-removed', (path: string) => {
      if (this.getCollectionName(path) === this.config.name) {
        this.emit('document-removed', this.getId(path));
      }
    });
    this.fileSys.on('ready', () => {
      this.emit('ready');
    });
  }

  public write(doc: any): void {
    this.storing = this.getPath(doc._id);
    this.fileSys.write(this.serializer.serialize(doc), this.storing);
  }

  public read(id?: string): Object {
    if (id) {
      return this.loadPath(this.getPath(id));
    } else {
      // TODO: Read all files in directory.
      return {};
    }
  }

  private update(event: string, path: string): void {
    if (this.storing !== path) {
      if (this.getCollectionName(path) === this.config.name) {
        this.emit(event, this.loadPath(path));
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
