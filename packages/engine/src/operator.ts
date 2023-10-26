import { Annotation, methodDecorator, PluginConfigurator } from "@tashmet/core";
import { Document } from "@tashmet/tashmet";
import { AggregatorFactory } from "./interfaces";


export class OperatorAnnotation extends Annotation {
  public constructor(
    public readonly name: string,
    public readonly propertyKey: string
  ) { super(); }

  public register(instance: any, aggFact: AggregatorFactory) {}
}

export class PipelineOperatorAnnotation extends OperatorAnnotation {
  public register(instance: any, aggFact: AggregatorFactory): void {
    aggFact.addPipelineOperator(this.name, (...args: any[]) => instance[this.propertyKey](...args));
  }
}

export class ExpressionOperatorAnnotation extends OperatorAnnotation {
  public register(instance: any, aggFact: AggregatorFactory): void {
    aggFact.addExpressionOperator(this.name, (...args: any[]) => instance[this.propertyKey](...args));
  }
}

export const op = {
  pipeline: (name: string) => methodDecorator<PipelineOperator<any>>(
    ({propertyKey}) => new PipelineOperatorAnnotation(name, propertyKey)
  ),
  expression: (name: string) => methodDecorator<ExpressionOperator<any>>(
    ({propertyKey}) => new ExpressionOperatorAnnotation(name, propertyKey)
  ),
}

export type ExpressionOperator<T> = (args: T, resolve: (path: string) => any) => any;

export type PipelineOperator<T> = (
  it: AsyncIterable<Document>,
  args: T,
  resolve: (doc: Document, path: string) => any
) => AsyncIterable<Document>;

export class OperatorPluginConfigurator<T> extends PluginConfigurator<T> {
  protected load() {
    this.container
      .resolve(AggregatorFactory)
      .addOperatorController(this.container.resolve(this.app));
  }
}
