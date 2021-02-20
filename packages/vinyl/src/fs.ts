import {AsyncFactory} from '@ziqquratu/core';
import {FileAccess, File, ReadableFile, Generator, pipe} from '@ziqquratu/nabu';
import {makeGenerator, writeToStream} from '@ziqquratu/stream';
import Vinyl from 'vinyl';
import * as stream from 'stream';
import * as chokidar from 'chokidar';
import * as vfs from 'vinyl-fs';
import * as fs from 'fs';
import minimatch from 'minimatch';


export const vinyl2File = pipe<Vinyl, File>(async vinyl => ({
  path: vinyl.path,
  content: makeGenerator(vinyl.contents as stream.Readable),
  isDir: vinyl.isDirectory()
}));

export const file2Vinyl = pipe<File, Vinyl>(async file => new Vinyl({
  path: file.path,
  contents: file.content,
}));


export class VinylFSService extends FileAccess  {
  public constructor(
    private watcher: chokidar.FSWatcher
  ) { super(); }

  public read(location: string | string[]): AsyncGenerator<ReadableFile> {
    return Generator.pump(
      makeGenerator(vfs.src(location, {buffer: false}) as stream.Transform),
      vinyl2File,
    );
  }

  public async write(files: AsyncGenerator<File>): Promise<void> {
    return writeToStream(Generator.pump(files, file2Vinyl), vfs.dest('.') as stream.Transform);
  }

  public async remove(files: AsyncGenerator<File>): Promise<void> {
    for await (const file of files) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  public watch(globs: string | string[], deletion = false): AsyncGenerator<File> {
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
        return fs.createReadStream(path);
      }

      for (const pattern of Array.isArray(globs) ? globs : [globs]) {
        if (minimatch(path, pattern)) {
          readable.push(new Vinyl({path: path, contents: contents()}))
        }
      }
    }

    for (const ev of deletion ? ['unlink'] : ['add', 'change']) {
      this.watcher.on(ev, path => onChange(path, ev));
    }

    return Generator.pump(makeGenerator(readable), vinyl2File);
  }
}

export class VinylFSServiceFactory extends AsyncFactory<FileAccess> {
  public constructor() {
    super('chokidar.FSWatcher');
  }

  public async create() {
    return this.resolve(async (watcher: chokidar.FSWatcher) => new VinylFSService(watcher));
  }
}

export const vinylfs = () => new VinylFSServiceFactory();
