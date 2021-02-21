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

/**
 * Create a file
 *
 * This pipe will turn the input into content of a file which is passed to the next step.
 *
 * @param path The file path given as a string or function returning a string.
 */
export function create<T>(path: string | ((data: T) => string)): Pipe<T, File<T>> {
  return async content => ({path: typeof path === 'string' ? path : path(content), content, isDir: false});
}

/**
 * A sink that writes files to a file system.
 *
 * @param protocol The file system protocol to use.
 */
export function write(protocol: AsyncFactory<FileAccess>): GeneratorSink<File<Buffer>, void> {
  return async files => {
    const fa = await protocol.create();
    return fa.write(files);
  }
}

/**
 * Parse incoming file content given a serializer.
 *
 * Turns a file with a buffer as content into a file where the content is parsed
 * using the given serializer.
 *
 * @param serializer
 */
export function parse<T = any>(serializer: IOGate<Pipe>): Pipe<File<Buffer>, File<T>> {
  return onKey('content', input<Buffer, T>(serializer));
}

/**
 * Serialize incoming file content given a serializer.
 *
 * Turns a file with content into a file where the content is serialized to a buffer
 * using the given serializer.
 *
 * @param serializer
 */
export function serialize<T>(serializer: IOGate<Pipe>): Pipe<File<T>, File<Buffer>> {
  return onKey('content', output<T, Buffer>(serializer))
}

/**
 * Rename a file
 *
 * Changes the path of incoming files to the path given as a string or a function
 * accepting the file as input.
 *
 * @param path string or function returning a string.
 */
export function rename<T>(path: string | ((file: File) => string)): Pipe<File<T>> {
  return async file => ({...file, path: typeof path === 'string' ? path : path(file)});
}

/**
 * Extract file content
 *
 * Turns incoming files into the content of each file.
 */
export function content<T>(): Pipe<File<T>, T> {
  return async file => file.content;
}

export function assignContent<In extends object, T extends object>(
  content: (file: File<In>) => T): Pipe<File<In>, File<In & T>>
{
  return async file => ({...file, content: Object.assign({}, file.content, content(file))});
}
