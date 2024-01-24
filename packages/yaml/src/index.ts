import { Container, provider, Provider } from '@tashmet/core';
import { Document } from '@tashmet/tashmet';
import { op, OperatorContext, OperatorPluginConfigurator } from '@tashmet/engine';
import { YamlOptions } from './interfaces.js';

import jsYaml from 'js-yaml';

export {YamlOptions} from './interfaces.js';

export interface LoadFrontResult {
  frontMatter: Document;

  body: string;
}

export function loadFront (content: string, options?: YamlOptions) {
  const re = /^(-{3}(?:\n|\r)([\w\W]+?)(?:\n|\r)-{3})?([\w\W]*)*/;
  const results = re.exec(content);
  let yamlOrJson;
  let frontMatter: any = {}

  if ((yamlOrJson = (results as any)[2])) {
      if (yamlOrJson.charAt(0) === '{') {
        frontMatter = JSON.parse(yamlOrJson);
      } else {
        frontMatter = jsYaml.load(yamlOrJson) as any;
      }
  }

  return { frontMatter, body: (results as any)[3] || '' }
}

const defaultOptions: YamlOptions = {
  indent: 2,
  skipInvalid: false,
  flowLevel: -1,
  sortKeys: false,
  lineWidth: 80,
  noRefs: false,
  noCompatMode: false,
  condenseFlow: false
};

@provider()
export class Yaml {
  public constructor(public options: YamlOptions) {}

  /**
   * Serialize object to YAML
   */
  @op.expression('$objectToYaml')
  public objectToYaml(obj: any, expr: any, ctx: OperatorContext) {
    const { data, frontMatter, contentKey, ...options } = this.normalizeExpression(expr);

    if (frontMatter) {
      const key = ctx.compute(obj, contentKey || '_content') as string;
      const doc = ctx.compute(obj, data);
      const content = ctx.resolve(doc, key);

      ctx.remove(doc, key);
      const fmData = jsYaml.dump(doc, options);
      let output = '---\n' + fmData + '---';
      if (content) {
        output += '\n' + content.replace(/^\s+|\s+$/g, '');
      }
      return output;
    } else {
      return jsYaml.dump(ctx.compute(obj, data), options);
    }
  }

  /**
   * Parse YAML to object
   */
  @op.expression('$yamlToObject')
  public yamlToObject(obj: any, expr: any, ctx: OperatorContext) {
    const { data, frontMatter, contentKey } = this.normalizeExpression(expr);

    if (frontMatter) {
      const selector = ctx.compute(obj, contentKey) as string || '_content';
      const loadResult = loadFront(ctx.compute(obj, data)) as any;

      const doc = loadResult.frontMatter;
      ctx.set(doc, selector, loadResult.body.trim());

      return doc;
    } else {
      const doc = jsYaml.load(ctx.compute(obj, data)) as any;
      if (typeof doc !== 'object') {
        throw new Error('Deserialized YAML is not an object')
      }
      return doc;
    }
  }

  private normalizeExpression(expr: string | Document) {
    if (typeof expr === 'string') {
      return Object.assign({ data: expr, frontMatter: false, contentKey: undefined }, this.options);
    } else {
      return Object.assign({}, this.options, expr);
    }
  }
}

export default (options?: YamlOptions) => (container: Container) =>
  new OperatorPluginConfigurator(Yaml, container)
    .provide(Provider.ofInstance(YamlOptions, Object.assign({}, defaultOptions, options)));
