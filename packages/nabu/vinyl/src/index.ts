import * as chokidar from 'chokidar';
import Vinyl from 'vinyl';
import * as stream from 'stream';
import * as vfs from 'vinyl-fs';
import * as fs from 'fs';
import minimatch from 'minimatch';
export * from './interfaces';

import {Container, Document, Optional, provider, Provider} from '@tashmet/tashmet';
import {FileAccess, File, ReadableFile, FileReader, FileWriter, ContentWriter, ContentReader, fileExtension} from '@tashmet/nabu';
import {Stream} from '@tashmet/nabu-stream';
import {FileSystemConfig} from './interfaces';


export class VinylFSReader implements FileReader {
  readonly pattern = /^((?!:).)*$/;

  public constructor(private contentReader: ContentReader) {}

  public read(location: string | string[], options: Document = {}): AsyncGenerator<ReadableFile> {
    const files = Stream.toGenerator(vfs.src(location, {buffer: options.content !== 'generator'}));
    const cr = this.contentReader;

    async function *reader() {
      for await (const vinyl of files()) {
        yield {
          path: vinyl.path,
          content: await cr.read(vinyl.contents, options),
          isDir: vinyl.isDirectory()
        };
      }
    }
    return reader();
  }
}

export class VinylFSWriter implements FileWriter {
  readonly pattern = /^((?!:).)*$/;

  public constructor(private contentWriter: ContentWriter) {}

  public async write(files: AsyncGenerator<File>, options: Document = {}): Promise<void> {
    async function *writer(cw: ContentWriter) {
      for await (const file of files) {
        if (file.content) {
          const ext = fileExtension(file.path);

          yield new Vinyl({
            path: file.path,
            contents: await cw.write(file.content, {content: ext}),
          });
        } else {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
    }
    return Stream.toSink(vfs.dest('.'))(writer(this.contentWriter));
  }
}


export default class VinylFS {
  public static configure(config: FileSystemConfig) {
    return (container: Container) => {
      /*
      if (config.watch) {
        container.register(
          Provider.ofInstance<chokidar.FSWatcher>('chokidar.FSWatcher', chokidar.watch([], {
            ignoreInitial: true,
            persistent: true
          }))
        );
      }
      */
      //container.register(VinylFS);

      return () => {
        const fa = container.resolve(FileAccess);
        const cr = container.resolve(ContentReader);
        const cw = container.resolve(ContentWriter);

        fa.registerWriter(new VinylFSWriter(cw));
        fa.registerReader(new VinylFSReader(cr));
      }
    }
  }
}
/*
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
*/
