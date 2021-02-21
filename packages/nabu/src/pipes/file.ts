import {AsyncFactory} from '@ziqquratu/core';
import {IOGate, Pipe} from '@ziqquratu/pipe';
import {File, FileAccess, GeneratorSink} from '../interfaces';
import {pipe, Transform} from '../transform';
import {input, onKey, output} from './common';

export function read<T>(): Transform<File<T>, File<Buffer>> {
  return pipe<File>(async file => {
    let res = file.content;

    if (file.content && !Buffer.isBuffer(file.content)) {
      const content = []
      for await (const chunk of file.content) {
        content.push(chunk);
      }
      res = Buffer.from(content.toString());
    }
    return {...file, content: res};
  });
}

export function create<T>(path: string | ((data: T) => string)): Pipe<T, File<T>> {
  return async content => ({path: typeof path === 'string' ? path : path(content), content, isDir: false});
}

export function write(protocol: AsyncFactory<FileAccess>): GeneratorSink<File, void> {
  return async files => {
    const fa = await protocol.create();
    return fa.write(files);
  }
}

export function parse<T = any>(serializer: IOGate<Pipe>): Transform<File<Buffer>, File<T>> {
  return onKey('content', input(serializer));
}

export function serialize<T>(serializer: IOGate<Pipe>): Transform<File<T>, File<Buffer>> {
  return onKey('content', output(serializer))
}

export function rename<T>(path: string | ((file: File) => string)): Pipe<File<T>> {
  return async file => ({...file, path: typeof path === 'string' ? path : path(file)});
}

export function content<T>(): Pipe<File<T>, T> {
  return async file => file.content;
}

export function assignContent<In extends object, T extends object>(
  content: (file: File<In>) => T): Pipe<File<In>, File<In & T>>
{
  return async file => ({...file, content: Object.assign({}, file.content, content(file))});
}
