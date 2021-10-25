import {Pipe} from '@tashmit/pipe';
import toArray from '@async-generators/to-array';
import {File, Serializer} from '../interfaces';
import {input, onKey, output} from './common';

/**
 * Read the content of a file into a buffer
 */
export function read(): Pipe<any, File<Buffer>> {
  return async file => {
    if (file.content && !Buffer.isBuffer(file.content)) {
      return {...file, content: Buffer.from((await toArray(file.content)).toString())};
    } else {
      return file;
    }
  };
}

/**
 * Create a file
 *
 * This pipe will turn the input into content of a file which is passed to the next step.
 *
 * @param path The file path given as a string or function returning a string.
 */
export function create<T>(path: string | Pipe<T, string>): Pipe<T, File<T>> {
  return async content => ({
    path: typeof path === 'string' ? path : await path(content),
    content,
    isDir: false
  });
}

/**
 * Parse incoming file content given a serializer.
 *
 * Turns a file with a buffer as content into a file where the content is parsed
 * using the given serializer.
 *
 * @param serializer
 */
export function parse<T = any>(serializer: Serializer<T>): Pipe<File<Buffer>, File<T>> {
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
export function serialize<T>(serializer: Serializer<T>): Pipe<File<T>, File<Buffer>> {
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
  content: Pipe<File<In>, T>): Pipe<File<In>, File<In & T>>
{
  return async file => ({...file, content: Object.assign({}, file.content, await content(file))});
}
