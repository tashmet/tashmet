const createClient = require('ipfs-http-client')

import {Container, Provider} from '@tashmet/core';
import {FileAccess, File, ReadableFile, Pipeline} from '@tashmet/file';
import path from 'path';
import minimatch from 'minimatch';

export class IPFSService extends FileAccess  {
  public static configure(url: string) {
    return (container: Container) => {
      container.register(Provider.ofFactory({
        key: FileAccess,
        create: () => new IPFSService(createClient({url}))
      }));
    }
  }

  public constructor(private ipfs: any) { super(); }

  public read(location: string | string[]): Pipeline<ReadableFile> {
    const ipfs = this.ipfs;

    if (Array.isArray(location)) {
      throw Error('Multiple paths currently not supported');
    }
    const dir = path.dirname(location);

    async function* content(filePath: string) {
      for await (const chunk of ipfs.files.read(filePath)) {
        yield chunk;
      }
    }

    async function* gen() {
      for await (const file of await ipfs.files.ls(dir)) {
        const filePath = path.join(dir, file.name);
        if (minimatch(filePath, location as string)) {
          yield {
            path: filePath,
            content: file.type === 'file' ? content(filePath) : undefined,
            isDir: file.type === 'dir',
          };
        }
      }
    }
    return new Pipeline(gen());
  }

  public async write(files: Pipeline<File>): Promise<void> {
    for await (const file of files) {
      await this.ipfs.files.write(file.path, file.content, {create: true});
    }
  }

  public async remove(files: Pipeline<File>): Promise<void> {
    for await (const file of files) {
      await this.ipfs.files.rm(file.path);
    }
  }
}