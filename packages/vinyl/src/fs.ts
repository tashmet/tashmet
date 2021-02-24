import {AsyncFactory} from '@ziqquratu/core';
import {Pipe} from '@ziqquratu/pipe';
import {FileAccess, File, ReadableFile, Pipeline} from '@ziqquratu/nabu';
import {Stream} from '@ziqquratu/stream';
import Vinyl from 'vinyl';
import * as stream from 'stream';
import * as chokidar from 'chokidar';
import * as vfs from 'vinyl-fs';
import * as fs from 'fs';
import minimatch from 'minimatch';


export function fromVinyl(): Pipe<Vinyl, File> {
  return async vinyl => ({
    path: vinyl.path,
    content: Stream.toPipeline(vinyl.contents as stream.Readable),
    isDir: vinyl.isDirectory()
  });
}

export function toVinyl(): Pipe<File, Vinyl> {
  return async file => new Vinyl({
    path: file.path,
    contents: file.content,
  });
}


export class VinylFSService extends FileAccess  {
  public constructor(
    private watcher: chokidar.FSWatcher
  ) { super(); }

  public read(location: string | string[]): Pipeline<ReadableFile> {
    return Stream.toPipeline<Vinyl>(vfs.src(location, {buffer: false}))
      .pipe<File>(fromVinyl());
  }

  public async write(files: Pipeline<File>): Promise<void> {
    return files
      .pipe(toVinyl())
      .sink(Stream.toSink(vfs.dest('.')));
  }

  public async remove(files: AsyncGenerator<File>): Promise<void> {
    for await (const file of files) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  public watch(globs: string | string[], deletion = false): Pipeline<File> {
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

    return Stream.toPipeline(readable).pipe<File>(fromVinyl());
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
