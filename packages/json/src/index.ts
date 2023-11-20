import { op, OperatorContext, OperatorPluginConfigurator } from '@tashmet/engine';
import { Container, provider, Provider } from '@tashmet/core';

export interface JsonOptions {
  /**
   * Indentation width to use (in spaces) when serializing.
   *
   * default: 2
   */
  indent?: number;
}

export abstract class JsonOptions implements JsonOptions {}

@provider()
export class Json {
  public constructor(private options: JsonOptions) {}

  @op.expression('$objectToJson')
  public objectToJson(obj: any, expr: any, ctx: OperatorContext) {
    return JSON.stringify(ctx.compute(obj, expr), undefined, this.options.indent);
  }

  @op.expression('$jsonToObject')
  public jsonToObject(obj: any, expr: any, ctx: OperatorContext) {
    return JSON.parse(ctx.compute(obj, expr));
  }
}

export default (options: JsonOptions = { indent: 2 }) => (container: Container) =>
  new OperatorPluginConfigurator(Json, container)
    .provide(Provider.ofInstance(JsonOptions, options));
