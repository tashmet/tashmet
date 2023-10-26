import { op, OperatorPluginConfigurator } from '@tashmet/engine';
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
  public objectToJson(expr: any, resolve: (expr: any) => any) {
    return JSON.stringify(resolve(expr), undefined, this.options.indent);
  }

  @op.expression('$jsonToObject')
  public jsonToObject(expr: any, resolve: (expr: any) => any) {
    return JSON.parse(resolve(expr));
  }
}

export default (options: JsonOptions = { indent: 2 }) => (container: Container) =>
  new OperatorPluginConfigurator(Json, container)
    .provide(Provider.ofInstance(JsonOptions, options));
