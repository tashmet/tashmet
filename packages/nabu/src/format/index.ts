import { Document } from '@tashmet/tashmet';
import { YamlFileFormat } from '../format/yaml.js';
import { JsonFileFormat } from '../format/json.js';
import { TextFileFormat } from './text.js';

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
    case 'text':
      return new TextFileFormat(formatOptions);
    default:
      throw new Error('Unknown file format: ' + formatName);
  }
}
