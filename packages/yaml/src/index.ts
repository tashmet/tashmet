import { Container, provider, Provider } from '@tashmet/core';
import { Document } from '@tashmet/tashmet';
import { op, OperatorContext, OperatorPluginConfigurator } from '@tashmet/engine';
import { YamlOptions } from './interfaces.js';

import jsYaml from 'js-yaml';

export {YamlOptions} from './interfaces.js';

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
    const { data, ...options } = this.normalizeExpression(expr);

    return jsYaml.dump(ctx.compute(obj, data), options);
  }

  /**
   * Parse YAML to object
   */
  @op.expression('$yamlToObject')
  public yamlToObject(obj: any, expr: any, ctx: OperatorContext) {
    const doc = jsYaml.load(ctx.compute(obj, expr)) as any;
    if (typeof doc !== 'object') {
      throw new Error('Deserialized YAML is not an object')
    }
    return doc;
  }

  private normalizeExpression(expr: string | Document) {
    if (typeof expr === 'string') {
      return Object.assign({ data: expr }, this.options);
    } else {
      return Object.assign({}, this.options, expr);
    }
  }
}

export default (options?: YamlOptions) => (container: Container) =>
  new OperatorPluginConfigurator(Yaml, container)
    .provide(Provider.ofInstance(YamlOptions, Object.assign({}, defaultOptions, options)));
