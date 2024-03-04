import { Document } from '@tashmet/tashmet';
import { YamlExpressionIO } from '../format/yaml.js';
import { TextFileFormat } from './text.js';
import { FrontmatterFileFormat } from './frontmatter.js';
import { ExpressionFileFormat } from './common.js';
import { JsonExpressionIO } from './json.js';
import { FileFormat } from '../interfaces.js';

export function makeFileFormat(format: string | Document, field: string = 'content'): FileFormat {
  const formatName = typeof format === 'object'
    ? Object.keys(format)[0]
    : format;
  const formatOptions = typeof format === 'object'
    ? format[formatName]
    : undefined;
      
  switch (formatName) {
    case 'frontmatter':
      const options = typeof formatOptions === 'string'
        ? { format: formatOptions, root: true }
        : formatOptions
      return new FrontmatterFileFormat(makeFileFormat, options);
    case 'yaml':
      return new ExpressionFileFormat(field, new YamlExpressionIO());
    case 'json':
      return new ExpressionFileFormat(field, new JsonExpressionIO());
    case 'text':
      return new TextFileFormat(formatOptions);
    default:
      throw new Error('Unknown file format: ' + formatName);
  }
}
