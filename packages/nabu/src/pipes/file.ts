import {AsyncFactory} from '@ziqquratu/core';
import {Pipe} from '@ziqquratu/pipe';
import {File, FileAccess, GeneratorSink, ReadableFile} from '../interfaces';
import {pipe, Transform, PipeableAsyncGenerator} from './util';

export function toBufferedFile(): Transform<ReadableFile, File<Buffer>> {
  return pipe<File>(async file => {
    let res = file.content;

    if (file.content) {
      const content = []
      for await (const chunk of file.content) {
        content.push(chunk);
      }
      res = Buffer.from(content.toString());
    }
    return {...file, content: res};
  });
}

export function toFile(path: string): Pipe<Buffer, File<Buffer>> {
  return async buffer => ({path, content: buffer, isDir: false});
}

export function toFileSystem(protocol: AsyncFactory<FileAccess>): GeneratorSink<File<Buffer>, void> {
  return async files => {
    const fa = await protocol.create();
    return fa.write(files);
  }
}

export function fromFileSystem(
  path: string | string[], protocol: AsyncFactory<FileAccess>
): PipeableAsyncGenerator<ReadableFile>
{
  async function* gen() {
    const fa = await protocol.create();
    for await (const file of fa.read(path)) {
      yield file;
    }
  }
  return new PipeableAsyncGenerator(gen());
}
