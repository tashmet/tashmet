import { Document } from "@tashmet/tashmet";
import { ContentRule } from "../content.js";
import { contentInDirectory } from './fs.js';

export interface JsonContentRule {
  merge?: Document;

  construct?: Document;
}

export function json(config: JsonContentRule): ContentRule {
  const def: Required<JsonContentRule> = {
    merge: { _id: '$path' },
    construct: {},
  }
  const { merge, construct } = { ...def, ...config };

  return ContentRule
    .fromRootReplace({ $jsonToObject: '$content' }, { $objectToJson: '$content' }, merge)
    .assign(construct);
}

export interface JsonInDirectoryOptions extends JsonContentRule {
  extension?: string;
}

export function jsonInDirectory(path: string, options: JsonInDirectoryOptions = {}) {
  const merge = { _id: { $basename: ['$path', { $extname: '$path' }] } };
  const { extension, ...jsonConfig } = { merge, ...options };

  return contentInDirectory(path, options?.extension || '.json', json(jsonConfig));
}
