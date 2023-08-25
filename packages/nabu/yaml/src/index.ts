import { Container } from '@tashmet/core';
import { Document } from '@tashmet/engine';
import { ContentReader, ContentWriter } from '@tashmet/nabu';
import { YamlConfig, YamlOptions } from './interfaces.js';

import jsYaml from 'js-yaml';
//import * as yamlFront from 'yaml-front-matter';

export {YamlConfig} from './interfaces.js';

function parse(text: string, options: any) {
    let contentKeyName = options && typeof options === 'string'
        ? options
        : options && options.contentKeyName 
            ? options.contentKeyName 
            : '__content';

    let passThroughOptions = options && typeof options === 'object'
        ? options
        : undefined;

    let re = /^(-{3}(?:\n|\r)([\w\W]+?)(?:\n|\r)-{3})?([\w\W]*)*/
        , results = re.exec(text)
        , conf: any = {}
        , yamlOrJson;

    if ((yamlOrJson = (results as any)[2])) {
        if (yamlOrJson.charAt(0) === '{') {
          conf = JSON.parse(yamlOrJson);
        } else {
          conf = jsYaml.load(yamlOrJson, passThroughOptions) as any;
        }
    }

    conf[contentKeyName] = (results as any)[3] || '';

    return conf;
};

export function loadFront (content: any, options?: any) {
    return parse(content, options);
};

const defaultOptions: YamlOptions = {
  frontMatter: false,
  contentKey: '_content',
  indent: 2,
  skipInvalid: false,
  flowLevel: -1,
  sortKeys: false,
  lineWidth: 80,
  noRefs: false,
  noCompatMode: false,
  condenseFlow: false
};

export function parseYaml(buffer: Buffer, config: YamlOptions = {}): Document {
  const {frontMatter, contentKey} = Object.assign({}, defaultOptions, config);
  const data = buffer.toString('utf-8');
  if (frontMatter) {
    const doc = loadFront(data) as any;
    const content = doc.__content.trim();
    doc[contentKey as string] = content;
    delete doc.__content;
    return doc;
  } else {
    const doc = jsYaml.load(data) as any;
    if (typeof doc !== 'object') {
      throw new Error('Deserialized YAML is not an object')
    }
    return doc
  }
}

/**
 * YAML parsing pipe
 *
 * @param buffer Buffer containing raw YAML data
 */
export function serializeYaml(data: Document, config?: YamlOptions): Buffer {
  const {frontMatter, contentKey, ...cfg} = Object.assign({}, defaultOptions, config);

  if (frontMatter) {
    const key = contentKey as string;
    const { [key]: omitted, ...rest } = data;
    const frontMatter = jsYaml.dump(rest, cfg);
    let output = '---\n' + frontMatter + '---';
    if (data[key]) {
      output += '\n' + data[key].replace(/^\s+|\s+$/g, '');
    }
    return Buffer.from(output, 'utf-8');
  } else {
    return Buffer.from(jsYaml.dump(data, cfg), 'utf-8');
  }
}

export default class NabuYaml {
  public static configure(config: YamlConfig) {
    return (container: Container) => {
      return () => {
        const cr = container.resolve(ContentReader);
        const cw = container.resolve(ContentWriter);

        for (const {match, ...opts} of config.rules || []) {
          cr.register(match, async content => parseYaml(content, opts));
          cw.register(match, async content => serializeYaml(content, opts));
        }
      }
    }
  }
}