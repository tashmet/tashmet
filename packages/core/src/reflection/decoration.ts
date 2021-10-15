import 'reflect-metadata';
import {
  ClassDecorator,
  MethodDecorator,
  MethodDecoratorConfig,
  Newable,
  ParameterDecorator,
  ParameterDecoratorConfig,
  PropertyDecorator,
  PropertyDecoratorConfig
} from './interfaces';

function decorate(target: object, annotation: any) {
  const annotations = Reflect.getOwnMetadata('annotations', target) || [];
  annotations.push(annotation);
  Reflect.defineMetadata('annotations', annotations, target);
}

function decorateProperty(target: object, propertyKey: string, annotation: any) {
  let properties = Reflect.getOwnMetadata('propMetadata', target.constructor);
  properties = properties || {};
  properties[propertyKey] = properties[propertyKey] || [];
  properties[propertyKey].push(annotation);
  Reflect.defineMetadata('propMetadata', properties, target.constructor);
  decorate(target.constructor, annotation);
}

function decorateParameter(
  target: object, propertyKey: string, parameterIndex: number, annotation: any
) {
  const parameters: any[][] = Reflect.getMetadata('parameters', target, propertyKey) || [];
  while (parameters.length <= parameterIndex) {
    parameters.push([]);
  }
  parameters[parameterIndex] = (parameters[parameterIndex] || []).concat(annotation);
  Reflect.defineMetadata('parameters', parameters, target, propertyKey);
}

export function classDecorator<T>(
  factory: (target: Newable<any>) => any
): ClassDecorator<T> {
  return function Decorator<C extends Newable<T>>(target: C): C {
    decorate(target, factory(target));
    return target;
  };
}

export function methodDecorator<T = any>(
  factory: (config: MethodDecoratorConfig) => any
): MethodDecorator<T> {
  return (target, propertyKey, descriptor) =>
    decorateProperty(target, propertyKey, factory({target, propertyKey, descriptor}));
}


export function propertyDecorator<T = any>(
  factory: (config: PropertyDecoratorConfig) => any
): PropertyDecorator<T> {
  return (target, propertyKey) =>
    decorateProperty(target, propertyKey, factory({target, propertyKey}));
}

export function parameterDecorator(
  factory: (config: ParameterDecoratorConfig) => any
): ParameterDecorator {
  return (target: any, propertyKey: string, parameterIndex: number) =>
    decorateParameter(target, propertyKey, parameterIndex,
      factory({target, propertyKey, parameterIndex})
    );
}
