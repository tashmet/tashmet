import { AsyncFactory } from '@ziqquratu/core';
import {FileAccess, File, ReadableFile} from '@ziqquratu/nabu';

const createClient = require('ipfs-http-client')

export class IPFSService implements FileAccess  {
  public constructor(private ipfs: any) {}

  public read(path: string | string[]): AsyncGenerator<ReadableFile> {
    const ipfs = this.ipfs;

    if (Array.isArray(path)) {
      throw Error('Multiple paths currently not supported');
    }
    async function* gen() {
      const stat = await ipfs.files.stat(path);

      for await (const file of ipfs.get(stat.cid)) {
        yield {
          path: file.path.replace(stat.cid, path),
          content: file.content,
          isDir: file.type === 'dir',
        };
      }
    }
    return gen();
  }

  //stat(path: string | string[]): AsyncGenerator<File<null>>;

  public async write(files: AsyncGenerator<File>): Promise<void> {
    for await (const file of files) {
      await this.ipfs.files.write(file.path, file.content, {create: true});
    }
  }

  public async remove(files: AsyncGenerator<File>): Promise<void> {
    for await (const file of files) {
      await this.ipfs.files.rm(file.path);
    }
  }
}

export class IPFSServiceFactory extends AsyncFactory<FileAccess> {
  public async create() {
    return new IPFSService(createClient());
  }
}

export const ipfs = () => new IPFSServiceFactory();
