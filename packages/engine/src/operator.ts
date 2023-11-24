import { Annotation, methodDecorator, PluginConfigurator } from "@tashmet/core";
import { Document } from "@tashmet/tashmet";
import { AggregatorFactory } from "./interfaces.js";

export interface OperatorContext {
  readonly options: any;

  /**
   * Set the value of the given object field
   *
   * @param obj the object context
   * @param selector  path to field
   * @param value the value to set
   */
  set(obj: Record<string, any> | Array<any>, selector: string, value: any): void;

  /**
   * Removes an element from the container.
   * If the selector resolves to an array and the leaf is a non-numeric key,
   * the remove operation will be performed on objects of the array.
   *
   * @param obj object or array
   * @param selector dot separated path to element to remove
   */
  remove(obj: Record<string, any> | Array<any>, selector: string): void;

  /**
   * Resolve the value of the field (dot separated) on the given object
   *
   * @param obj the object context
   * @param selector dot separated path to field
   * @returns The value
   */
  resolve(obj: Record<string, any> | Array<any>, selector: string): any;

  /**
   * Computes the value of the expression on the object for the given operator
   *
   * @param obj the current object from the collection
   * @param expr the expression for the given field
   * @param operator the operator to resolve the field with
   * @returns The computed value
   */
  compute(obj: any, expr: any, operator?: string): any;
}

export class OperatorAnnotation extends Annotation {
  public constructor(
    public readonly name: string | string[],
    public readonly propertyKey: string
  ) { super(); }

  public register(instance: any, aggFact: AggregatorFactory) {}
}

export class PipelineOperatorAnnotation extends OperatorAnnotation {
  public register(instance: any, aggFact: AggregatorFactory): void {
    for (const op of Array.isArray(this.name) ? this.name : [this.name]) {
      aggFact.addPipelineOperator(op, (...args: any[]) => instance[this.propertyKey](...args));
    }
  }
}

export class ExpressionOperatorAnnotation extends OperatorAnnotation {
  public register(instance: any, aggFact: AggregatorFactory): void {
    for (const op of Array.isArray(this.name) ? this.name : [this.name]) {
      aggFact.addExpressionOperator(op, (...args: any[]) => instance[this.propertyKey](...args));
    }
  }
}

export type ExpressionOperator<T> = (obj: any, args: T, context: OperatorContext) => any;

export type PipelineOperator<T> = (
  it: AsyncIterable<Document>,
  args: T,
  context: OperatorContext,
) => AsyncIterable<Document>;

export const op = {
  pipeline: (name: string | string[]) => methodDecorator<PipelineOperator<any>>(
    ({propertyKey}) => new PipelineOperatorAnnotation(name, propertyKey)
  ),
  expression: (name: string | string[]) => methodDecorator<ExpressionOperator<any>>(
    ({propertyKey}) => new ExpressionOperatorAnnotation(name, propertyKey)
  ),
}


export class OperatorPluginConfigurator<T> extends PluginConfigurator<T> {
  protected load() {
    this.container
      .resolve(AggregatorFactory)
      .addOperatorController(this.container.resolve(this.app));
  }
}
