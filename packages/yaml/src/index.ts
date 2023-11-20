import { Container, provider, Provider } from '@tashmet/core';
import { op, OperatorContext, OperatorPluginConfigurator } from '@tashmet/engine';
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

  @op.expression('$objectToYaml')
  public objectToYaml(obj: any, expr: any, ctx: OperatorContext) {
    if (typeof expr === 'object' && expr.frontMatter === true) {
      const key = ctx.compute(obj, expr.contentKey || '_content') as string;
      const data = ctx.compute(obj, expr.path);
      const content = ctx.resolve(data, key);


      ctx.remove(data, key);
      const frontMatter = jsYaml.dump(data, this.options);
      let output = '---\n' + frontMatter + '---';
      if (content) {
        output += '\n' + content.replace(/^\s+|\s+$/g, '');
      }
      return output;
    } else {
      const path = typeof expr === 'string' ? expr : expr.path;
      return jsYaml.dump(ctx.compute(obj, path), this.options);
    }
  }

  @op.expression('$yamlToObject')
  public yamlToObject(obj: any, expr: any, ctx: OperatorContext) {
    if (typeof expr === 'object' && expr.frontMatter === true) {
      const contentKey = ctx.compute(obj, expr.contentKey) as string || '_content';
      const data = ctx.compute(obj, expr.path);

      const doc = loadFront(data) as any;
      ctx.set(doc, contentKey, doc.__content.trim());
      delete doc.__content;
      return doc;
    } else {
      const path = typeof expr === 'string'
        ? expr
        : expr.path ? expr.path : expr;
      const doc = jsYaml.load(ctx.compute(obj, path)) as any;
      if (typeof doc !== 'object') {
        throw new Error('Deserialized YAML is not an object')
      }
      return doc;
    }
  }
}

export default (options?: YamlOptions) => (container: Container) =>
  new OperatorPluginConfigurator(Yaml, container)
    .provide(Provider.ofInstance(YamlOptions, Object.assign({}, defaultOptions, options)));
