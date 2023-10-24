import { Document } from "@tashmet/tashmet";
import { ContentRule } from "../content.js";
import { contentInDirectory, fs } from '../io/fs.js';

export interface YamlContentRule {
  frontMatter?: boolean;

  contentKey?: string;

  merge?: Document;

  construct?: Document;
}

export function yaml(config: YamlContentRule): ContentRule {
  const def: Required<YamlContentRule> = {
    frontMatter: false,
    contentKey: '_content',
    merge: { _id: '$path' },
    construct: {},
  }
  const { frontMatter, contentKey, merge, construct } = { ...def, ...config };

  const input = frontMatter ? { $yamlfmToObject: '$content' } : { $yamlToObject: '$content' };
  const output = frontMatter ? { $objectToYamlfm: '$content' } : { $objectToYaml: '$content' };

  return ContentRule
    .fromRootReplace(input, output, merge)
    .rename('_content', contentKey)
    .assign(construct);
}

export interface YamlInDirectoryOptions extends YamlContentRule {
  extension?: string;
}

export function yamlInDirectory(path: string, options?: YamlInDirectoryOptions) {
  const merge = { _id: { $basename: ['$path', { $extname: '$path' }] } };
  const { extension, ...yamlConfig } = { merge, ...options };

  return contentInDirectory(path, options?.extension || '.yaml', yaml(yamlConfig));
}
