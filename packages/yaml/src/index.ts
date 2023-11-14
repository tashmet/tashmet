import { Container, provider, Provider } from '@tashmet/core';
import { op, OperatorPluginConfigurator } from '@tashmet/engine';
import { Document } from '@tashmet/tashmet';
import { YamlOptions } from './interfaces.js';

import jsYaml from 'js-yaml';

export {YamlOptions} from './interfaces.js';

export function loadFront (content: any, options?: any) {
  let contentKeyName = options && typeof options === 'string'
      ? options
      : options && options.contentKeyName
          ? options.contentKeyName
          : '__content';

  let passThroughOptions = options && typeof options === 'object'
      ? options
      : undefined;

  let re = /^(-{3}(?:\n|\r)([\w\W]+?)(?:\n|\r)-{3})?([\w\W]*)*/
      , results = re.exec(content)
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

export function parseYaml(data: string, config: YamlOptions = {}): Document {
  const {frontMatter, contentKey} = Object.assign({}, defaultOptions, config);
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
export function serializeYaml(data: Document, config?: YamlOptions): string {
  const {frontMatter, contentKey, ...cfg} = Object.assign({}, defaultOptions, config);

  if (frontMatter) {
    const key = contentKey as string;
    const { [key]: omitted, ...rest } = data;
    const frontMatter = jsYaml.dump(rest, cfg);
    let output = '---\n' + frontMatter + '---';
    if (data[key]) {
      output += '\n' + data[key].replace(/^\s+|\s+$/g, '');
    }
    return output;
  } else {
    return jsYaml.dump(data, cfg);
  }
}

@provider()
export class Yaml {
  public constructor(public options: YamlOptions) {}

  @op.expression('$objectToYaml')
  public objectToYaml(expr: any, resolve: (expr: any) => any) {
    if (typeof expr === 'object' && expr.frontMatter === true) {
      const key = resolve(expr.contentKey) as string;
      const data = resolve(expr.path);

      const { [key]: omitted, ...rest } = data;
      const frontMatter = jsYaml.dump(rest, this.options);
      let output = '---\n' + frontMatter + '---';
      if (data[key]) {
        output += '\n' + data[key].replace(/^\s+|\s+$/g, '');
      }
      return output;
    } else {
      return jsYaml.dump(resolve(expr), this.options);
    }
  }

  @op.expression('$yamlToObject')
  public yamlToObject(expr: any, resolve: (expr: any) => any) {
    if (typeof expr === 'object' && expr.frontMatter === true) {
      const contentKey = resolve(expr.contentKey) as string;
      const data = resolve(expr.path);

      const doc = loadFront(data) as any;
      const content = doc.__content.trim();
      doc[contentKey as string] = content;
      delete doc.__content;
      return doc;
    } else {
      const doc = jsYaml.load(resolve(expr)) as any;
      if (typeof doc !== 'object') {
        throw new Error('Deserialized YAML is not an object')
      }
      return doc;
    }
  }

  @op.expression('$objectToYamlfm')
  public objectToYamlfm(expr: any, resolve: (expr: any) => any) {
    return serializeYaml(resolve(expr), { ...this.options, frontMatter: true });
  }

  @op.expression('$yamlfmToObject')
  public yamlfmToObject(expr: any, resolve: (expr: any) => any) {
    return parseYaml(resolve(expr), { ...this.options, frontMatter: true });
  }
}

export default (options: YamlOptions = {}) => (container: Container) =>
  new OperatorPluginConfigurator(Yaml, container)
    .provide(Provider.ofInstance(YamlOptions, options));
