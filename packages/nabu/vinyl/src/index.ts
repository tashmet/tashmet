import * as chokidar from 'chokidar';
import Vinyl from 'vinyl';
import * as stream from 'stream';
import vfs from 'vinyl-fs';
import fs from 'fs';
import * as nodePath from 'path';
import minimatch from 'minimatch';
export * from './interfaces.js';

import {Container } from '@tashmet/tashmet';
import {FileAccess, File, ReadableFile, FileReader, FileWriter } from '@tashmet/nabu';
import {Stream} from '@tashmet/nabu-stream';
import {FileSystemConfig} from './interfaces.js';
import { BootstrapConfig, plugin, PluginConfigurator } from '@tashmet/core';
import { AggregatorFactory } from '@tashmet/engine';


export class VinylFSReader implements FileReader {
  readonly pattern = /^((?!:).)*$/;

  public async *read(location: string | string[], options: any): AsyncGenerator<ReadableFile> {
    const files = Stream.toGenerator(vfs.src(location, {
      buffer: options?.content !== false,
      read: options?.content !== false,
      allowEmpty: true
    }));

    for await (const vinyl of files()) {
      yield {
        path: vinyl.path,
        content: vinyl.contents ? vinyl.contents.toString('utf-8'): null,
        isDir: vinyl.isDirectory()
      }
    }
  }
}

export class VinylFSWriter implements FileWriter {
  readonly pattern = /^((?!:).)*$/;

  public async write(files: AsyncGenerator<File>): Promise<any> {
    const deletes: string[] = [];
    const writeErrors: any[] = [];
    let index = 0;

    async function *writer() {
      for await (const {path, content, overwrite} of files) {

        if (!overwrite && fs.existsSync(path)) {
          writeErrors.push({ errMsg: `Trying to overwrite file: ${path} with overwrite flag set to false`, index })
        }

        if (content) {
          yield new Vinyl({
            path,
            contents: Buffer.from(content),
          });
        } else {
          deletes.push(path);
        }

        index++;
      }
    }

    await Stream.toSink(vfs.dest('.'))(writer());

    for (const path of deletes) {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    }
    return writeErrors;
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
    const aggFact = this.container.resolve(AggregatorFactory);

    fa.registerWriter(new VinylFSWriter());
    fa.registerReader(new VinylFSReader());

    async function *$write(it: AsyncIterable<Document>, expr: any, resolve: any) {
      let index = 0;

      for await (const doc of it) {
        const content = resolve(doc, expr.content);
        const path = resolve(doc, expr.to);
        const overwrite = resolve(doc, expr.overwrite);

        if (!overwrite && fs.existsSync(path)) {
          yield {
            errMsg: `Trying to overwrite file: ${path} with overwrite flag set to false`,
            index
          };
        }

        if (content) {
          const dir = nodePath.dirname(path);

          if (!fs.existsSync(dir))  {
            fs.mkdirSync(dir, { recursive: true });
          }

          fs.writeFileSync(path, Buffer.from(content));
        } else {
          if (fs.existsSync(path)) {
            fs.unlinkSync(path);
          }
        }

        index++;
      }
    }

    aggFact.addPipelineOperator('$writeFile', $write);

    aggFact.addExpressionOperator('$lstat', (args, resolve) => {
      const res = fs.lstatSync(resolve(args));
      return {
        ...res,
        isBlockDevice: res.isBlockDevice(),
        isCharacterDevice: res.isCharacterDevice(),
        isDirectory: res.isDirectory(),
        isFIFO: res.isFIFO(),
        isFile: res.isFile(),
        isSocket: res.isSocket(),
        isSymbolicLink: res.isSymbolicLink(),
      };
    });

    aggFact.addExpressionOperator('$readFile', (args, resolve) => {
      return fs.readFileSync(resolve(args), 'utf-8');
    });
  }
}