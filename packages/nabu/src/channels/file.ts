import {FSWatcher} from 'chokidar';
import {EventEmitter} from 'eventemitter3';
import * as fs from 'fs-extra';
import {Channel, Serializer} from '../interfaces';

export class File extends EventEmitter implements Channel {
  public constructor(
    public serializer: Serializer,
    public path: string,
    watcher?: FSWatcher
  ) {
    super();
    if (watcher) {
      watcher
        .on('add', filePath => this.onUpdate(filePath))
        .on('change', filePath => this.onUpdate(filePath))
        .add(path);
    }
  }

  public toString(): string {
    return `file at '${this.path}'`;
  }

  public async read(): Promise<any> {
    return await this.serializer.deserialize(await fs.readFile(this.path));
  }

  public async write(data: any): Promise<any> {
    if (Object.keys(data).length === 0) {
      return fs.unlinkSync(this.path);
    } else {
      return fs.writeFile(this.path, await this.serializer.serialize(data));
    }
  }

  private async onUpdate(path: string) {
    if (path === this.path) {
      this.emit('data-updated', await this.read());
    }
  }
}
