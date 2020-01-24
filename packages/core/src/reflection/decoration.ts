import 'reflect-metadata';
import {Newable} from './interfaces';

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

export function classDecorator<T>(factory: (target: Newable<any>) => any) {
  return function Decorator<C extends Newable<T>>(target: C): C {
    decorate(target, factory(target));
    return target;
  };
}

export function methodDecorator<T = any>(
  factory: (target: any, propertyName: string, descriptor: PropertyDescriptor) => any
) {
  return function Decorator<K extends string, C extends Record<K, T>>(
    target: C, propertyKey: K, descriptor: PropertyDescriptor
  ) {
    decorateProperty(target, propertyKey, factory(target, propertyKey, descriptor));
  };
}

export function propertyDecorator<T = any>(
  factory: (target: any, propertyKey: string) => any
) {
  return function Decorator<K extends string, C extends Record<K, T>>(
    target: C, propertyKey: K
  ) {
    decorateProperty(target, propertyKey, factory(target, propertyKey));
  };
}

export function parameterDecorator(
  factory: (target: any, propertyKey: string, parameterIndex: number) => any
) {
  return function Decorator(target: any, propertyKey: string, parameterIndex: number) {
    decorateParameter(
      target, propertyKey, parameterIndex, factory(target, propertyKey, parameterIndex)
    );
  };
}
