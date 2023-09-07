import * as chokidar from 'chokidar';
import Vinyl from 'vinyl';
import * as stream from 'stream';
import vfs from 'vinyl-fs';
import fs from 'fs';
import minimatch from 'minimatch';
export * from './interfaces.js';

import {Container } from '@tashmet/tashmet';
import {FileAccess, File, ReadableFile, FileReader, FileWriter, ContentWriter, ContentReader, fileExtension} from '@tashmet/nabu';
import {Stream} from '@tashmet/nabu-stream';
import {FileSystemConfig} from './interfaces.js';
import { BootstrapConfig, plugin, PluginConfigurator } from '@tashmet/core';


export class VinylFSReader implements FileReader {
  readonly pattern = /^((?!:).)*$/;

  public constructor(private contentReader: ContentReader) {}

  public read(location: string | string[]): AsyncGenerator<ReadableFile> {
    const files = Stream.toGenerator(vfs.src(location, {buffer: true}));
    const cr = this.contentReader;

    async function *reader() {
      for await (const vinyl of files()) {
        yield await cr.read({
          path: vinyl.path,
          content: vinyl.contents,
          isDir: vinyl.isDirectory()
        });
      }
    }
    return reader();
  }
}

export class VinylFSWriter implements FileWriter {
  readonly pattern = /^((?!:).)*$/;

  public constructor(private contentWriter: ContentWriter) {}

  public async write(files: AsyncGenerator<File>): Promise<void> {
    const deletes: string[] = [];

    async function *writer(cw: ContentWriter) {
      for await (const file of files) {
        const {path, content} = await cw.write(file);

        if (file.content) {
          yield new Vinyl({
            path,
            contents: content,
          });
        } else {
          deletes.push(file.path);
        }
      }
    }
    return Stream.toSink(vfs.dest('.'))(writer(this.contentWriter)).then(() => {
      for (const path of deletes) {
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
        }
      }
    });
  }
}


@plugin<FileSystemConfig>()
export default class VinylFS {
  public static configure(config: Partial<BootstrapConfig> & FileSystemConfig, container?: Container) {
    return new VinylConfigurator(VinylFS, config, container);
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

export class VinylConfigurator extends PluginConfigurator<VinylFS, FileSystemConfig> {
  public load() {
    const fa = this.container.resolve(FileAccess);
    const cr = this.container.resolve(ContentReader);
    const cw = this.container.resolve(ContentWriter);

    fa.registerWriter(new VinylFSWriter(cw));
    fa.registerReader(new VinylFSReader(cr));
  }
}