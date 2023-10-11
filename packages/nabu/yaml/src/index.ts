import { BootstrapConfig, Container, plugin, PluginConfigurator } from '@tashmet/core';
import { AggregatorFactory, Document, ExpressionOperator } from '@tashmet/engine';
import { YamlConfig, YamlOptions } from './interfaces.js';

import jsYaml from 'js-yaml';

export {YamlConfig} from './interfaces.js';

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

export const $objectToYaml: ExpressionOperator<string> = (args, resolve) => {
  return serializeYaml(resolve(args));
}

export const $yamlToObject: ExpressionOperator<string> = (args, resolve) => {
  return parseYaml(resolve(args));
}

export const $yamlfmDump: ExpressionOperator<string> = (args, resolve) => {
  return serializeYaml(resolve(args), { frontMatter: true });
}

export const $yamlfmParse: ExpressionOperator<string> = (args, resolve) => {
  return parseYaml(resolve(args), { frontMatter: true });
}

@plugin<YamlConfig>()
export default class NabuYaml {
  public static configure(config: Partial<BootstrapConfig> & YamlConfig, container?: Container) {
    return new YamlConfigurator(NabuYaml, config, container);
  }
}

export class YamlConfigurator extends PluginConfigurator<NabuYaml, YamlConfig> {
  public load() {
    const aggFact = this.container.resolve(AggregatorFactory);

    aggFact.addExpressionOperator('$objectToYaml', $objectToYaml);
    aggFact.addExpressionOperator('$yamlToObject', $yamlToObject);
    aggFact.addExpressionOperator('$yamlfmDump', $yamlfmDump);
    aggFact.addExpressionOperator('$yamlfmParse', $yamlfmParse);
  }
}
