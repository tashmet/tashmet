import { Document } from '@tashmet/tashmet';
import { FileStreamIO } from '../io/fileStream.js';
import { ArrayInFileIO } from '../io/arrayInFile.js';
import { YamlFileFormat } from '../format/yaml.js';
import { JsonFileFormat } from '../format/json.js';
import { BufferIO, StreamIO } from '../interfaces.js';
import { ObjectInFileIO } from './objectInFile.js';

export function makeFileFormat(format: string | Document) {
  const formatName = typeof format === 'object'
    ? Object.keys(format)[0]
    : format;
  const formatOptions = typeof format === 'object'
    ? format[formatName]
    : undefined;

  switch (formatName) {
    case 'yaml':
      return new YamlFileFormat(formatOptions);
    case 'json':
      return new JsonFileFormat();
    default:
      throw new Error('Unknown file format: ' + formatName);
  }
}

export function makeGlobIO({pattern, format, ...options}: Document) {
    const merge = Object.assign(
      {}, options?.merge, { _id: '$path' }
    );

    return new FileStreamIO(
      id => id ? id : pattern,
      makeFileFormat(format),
      merge,
      options?.construct
    );
}

export function makeDirectoryIO({path, extension, format, ...options}: Document) {
  const merge = Object.assign(
    {}, options?.merge, { _id: { $basename: ['$path', { $extname: '$path' }] } }
  );

  return new FileStreamIO(
    id => id ? `${path}/${id}${extension}` : `${path}/*${extension}`,
    makeFileFormat(format),
    merge,
    options?.construct
  );
}

export function makeArrayInFileIO({path, format, ...options}: Document) {
  return new ArrayInFileIO(path, makeFileFormat(format), options);
}

export function makeObjectInFileIO({path, format, ...options}: Document) {
  return new ObjectInFileIO(path, makeFileFormat(format), options);
}

export function makeIO(store: Document): StreamIO | BufferIO {
  const name = Object.keys(store)[0];
  const config = store[name];

  switch (name) {
    case 'directory':
      return makeDirectoryIO(config);
    case 'glob':
      return makeGlobIO(config);
    case 'arrayInFile':
      return makeArrayInFileIO(config);
    case 'objectInFile':
      return makeObjectInFileIO(config);
    default:
      throw new Error('Unsupported IO: ' + name);
  }
}