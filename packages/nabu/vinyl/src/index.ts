import * as chokidar from 'chokidar';
import Vinyl from 'vinyl';
import * as stream from 'stream';
import * as vfs from 'vinyl-fs';
import * as fs from 'fs';
import minimatch from 'minimatch';
export * from './interfaces';

import {Container, Optional, provider, Provider} from '@tashmet/tashmet';
import {FileAccess, File, ReadableFile} from '@tashmet/nabu';
import {Stream} from '@tashmet/nabu-stream';
import {FileSystemConfig} from './interfaces';


@provider({
  key: FileAccess,
  inject: [Optional.of('chokidar.FSWatcher')]
})
export default class VinylFS extends FileAccess  {
  public static configure(config: FileSystemConfig) {
    return (container: Container) => {
      if (config.watch) {
        container.register(
          Provider.ofInstance<chokidar.FSWatcher>('chokidar.FSWatcher', chokidar.watch([], {
            ignoreInitial: true,
            persistent: true
          }))
        );
      }
      container.register(VinylFS);
    }
  }

  public constructor(
    private watcher: chokidar.FSWatcher | undefined
  ) { super(); }

  public read(location: string | string[]): AsyncGenerator<ReadableFile> {
    const files = Stream.toGenerator(vfs.src(location, {buffer: true}));

    async function *reader() {
      for await (const vinyl of files()) {
        yield {
          path: vinyl.path,
          content: vinyl.contents,
          isDir: vinyl.isDirectory()
        };
      }
    }
    return reader();
  }

  public async write(files: AsyncGenerator<File>): Promise<void> {
    async function *writer() {
      for await (const file of files) {
        if (file.content) {
          yield new Vinyl({
            path: file.path,
            contents: file.content,
          });
        } else {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
    }
    return Stream.toSink(vfs.dest('.'))(writer());
  }

  public watch(globs: string | string[], deletion = false): AsyncGenerator<File> | null {
    if (!this.watcher) {
      return null;
    }

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

    return Stream.toGenerator(readable)();//.pipe<File>(Pipes.fromVinyl());
  }
}
