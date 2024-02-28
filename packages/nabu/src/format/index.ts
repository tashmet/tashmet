import { Document } from '@tashmet/tashmet';
import { YamlExpressionIO } from '../format/yaml.js';
import { TextFileFormat } from './text.js';
import { FrontmatterFileFormat } from './frontmatter.js';
import { ExpressionFileFormat } from './common.js';
import { JsonExpressionIO } from './json.js';

export function makeFileFormat(format: string | Document) {
  const formatName = typeof format === 'object'
    ? Object.keys(format)[0]
    : format;
  const formatOptions = typeof format === 'object'
    ? format[formatName]
    : undefined;
      
  switch (formatName) {
    case 'yaml':
      return new ExpressionFileFormat(new YamlExpressionIO());
    case 'yamlFrontmatter':
      return new FrontmatterFileFormat(new YamlExpressionIO(), formatOptions || {});
    case 'json':
      return new ExpressionFileFormat(new JsonExpressionIO());
    case 'jsonFrontmatter':
      return new FrontmatterFileFormat(new YamlExpressionIO(), formatOptions || {});
    case 'text':
      return new TextFileFormat(formatOptions);
    default:
      throw new Error('Unknown file format: ' + formatName);
  }
}
