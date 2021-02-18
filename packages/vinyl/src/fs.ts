import {provider, AsyncFactory} from '@ziqquratu/core';
import {FileAccess, File, ReadableFile, pump, pipe, Transform} from '@ziqquratu/nabu';
import Vinyl from 'vinyl';
import {makeGenerator, writeToStream} from './util';
import * as stream from 'stream';
import * as chokidar from 'chokidar';
import * as vfs from 'vinyl-fs';
import * as fs from 'fs';
import minimatch from 'minimatch';
import {FileSystemConfig} from "./interfaces";

@provider({
  inject: ['vinyl.FileSystemConfig', 'chokidar.FSWatcher'],
})
export class VinylFS {
  public constructor(
    private config: FileSystemConfig,
    private watcher: chokidar.FSWatcher
  ) {}

  public src(globs: string | string[], options?: vfs.SrcOptions): AsyncGenerator<Vinyl> {
    return makeGenerator(vfs.src(globs, options) as stream.Transform);
  }
  
  public watch(globs: string | string[], events: string[], options?: vfs.SrcOptions): AsyncGenerator<Vinyl> {
    this.watcher.add(globs);

    const readable = new stream.Readable({
      objectMode: true,
      read() { return; }
    });

    const onChange = (path: string, event: string) => {
      const contents = () => {
        if (event === 'unlink') {
          return Buffer.from('{}');
        }
        if (options?.read === false) {
          return null;
        }
        if (options?.buffer === false) {
          return fs.createReadStream(path);
        }
        return fs.readFileSync(path);
      }

      for (const pattern of Array.isArray(globs) ? globs : [globs]) {
        if (minimatch(path, pattern)) {
          readable.push(new Vinyl({path: path, contents: contents()}))
        }
      }
    }

    for (const ev of events) {
      this.watcher.on(ev, path => onChange(path, ev));
    }

    return makeGenerator(readable);
  }

  public write(files: AsyncGenerator<Vinyl>, folder: string) {
    return writeToStream(files, vfs.dest(folder) as stream.Transform);
  }

  public async remove(files: AsyncGenerator<Vinyl>) {
    for await (const file of files) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }
}

export const vinyl2File = pipe<Vinyl, File>(async vinyl => ({
  path: vinyl.path,
  content: makeGenerator(vinyl.contents as stream.Readable),
  isDir: vinyl.isDirectory()
}));

export const file2Vinyl = pipe<File, Vinyl>(async file => new Vinyl({
  path: file.path,
  contents: file.content,
}));

export class VinylFSService implements FileAccess  {
  public read(location: string | string[]): AsyncGenerator<ReadableFile> {
    return pump(
      makeGenerator(vfs.src(location, {buffer: false}) as stream.Transform),
      vinyl2File,
    );
  }

  //stat(path: string | string[]): AsyncGenerator<File<null>>;

  public async write(files: AsyncGenerator<File>): Promise<void> {
    return writeToStream(pump(files, file2Vinyl), vfs.dest('.') as stream.Transform);
  }

  public async remove(files: AsyncGenerator<File>): Promise<void> {
    for await (const file of files) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }
}

export class VinylFSServiceFactory extends AsyncFactory<FileAccess> {
  public async create() {
    return new VinylFSService();
  }
}

export const vinylfs = () => new VinylFSServiceFactory();
