import { AggregatorFactory, op } from '@tashmet/engine';
import { Container, PluginConfigurator, provider, Provider } from '@tashmet/core';

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

export class JsonConfigurator extends PluginConfigurator<Json> {
  public constructor(container: Container, private options: JsonOptions) {
    super(Json, container);
  }

  protected register(): void {
    this.container.register(Provider.ofInstance(JsonOptions, this.options));
  }

  protected load() {
    this.container
      .resolve(AggregatorFactory)
      .addOperatorController(this.container.resolve(Json));
  }
}

export default (options: JsonOptions = { indent: 2 }) => (container: Container) =>
  new JsonConfigurator(container, options);
