import { AggregatorFactory, op } from '@tashmet/engine';
import { Container, PluginConfigurator } from '@tashmet/core';

export class Json {
  @op.expression('$objectToJson')
  public objectToJson(expr: any, resolve: (expr: any) => any) {
    return JSON.stringify(resolve(expr));
  }

  @op.expression('$jsonToObject')
  public jsonToObject(expr: any, resolve: (expr: any) => any) {
    return JSON.parse(resolve(expr));
  }
}

export class JsonConfigurator extends PluginConfigurator<Json> {
  public load() {
    this.container.resolve(AggregatorFactory).addOperatorController(new Json());
  }
}

export default () => (container: Container) => new JsonConfigurator(Json, container);
