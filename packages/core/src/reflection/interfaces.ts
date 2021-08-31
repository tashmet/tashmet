export interface Newable<T> {
  /**
   * Call signature for a constructor function.
   * @param args Arguments for the constructor.
   */
  new (...args: any[]): T;
}

export interface Abstract<T> {
  prototype: T;
}

export interface Constructor<T> extends Newable<T> {
  /**
   * The name of the type.
   */
  name?: string;
}

export interface PropertyDecoratorConfig {
  target: any;
  propertyKey: string;
}

export interface MethodDecoratorConfig extends PropertyDecoratorConfig {
  descriptor: PropertyDescriptor;
}

export interface ParameterDecoratorConfig extends PropertyDecoratorConfig {
  parameterIndex: number;
}
