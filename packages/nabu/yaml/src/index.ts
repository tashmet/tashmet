import { Container } from '@tashmet/core';
import { Document } from '@tashmet/engine';
import { ContentReader, ContentWriter } from '@tashmet/nabu';
import { YamlConfig, YamlOptions } from './interfaces';

import jsYaml = require('js-yaml');
const yamlFront = require('yaml-front-matter');


export {YamlConfig} from './interfaces';

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
    const doc = yamlFront.loadFront(data);
    const content = doc.__content.trim();
    doc[contentKey as string] = content;
    delete doc.__content;
    return doc;
  } else {
    const doc = jsYaml.safeLoad(data)
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
    const frontMatter = jsYaml.safeDump(rest, cfg);
    let output = '---\n' + frontMatter + '---';
    if (data[key]) {
      output += '\n' + data[key].replace(/^\s+|\s+$/g, '');
    }
    return Buffer.from(output, 'utf-8');
  } else {
    return Buffer.from(jsYaml.safeDump(data, cfg), 'utf-8');
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
