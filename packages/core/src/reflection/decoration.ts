import 'reflect-metadata';
import {
  ClassDecorator,
  Metadata,
  MethodDecorator,
  MethodDecoratorConfig,
  Newable,
  ParameterDecorator,
  ParameterDecoratorConfig,
  PropertyDecorator,
  PropertyDecoratorConfig
} from './interfaces';

function metadata<T>(
  name: string, target: any, initialState: T, propertyKey?: string | symbol
) {
  const read = (inherit?: boolean) => {
    const reader = inherit ? Reflect.getMetadata : Reflect.getOwnMetadata as any
    return reader(name, target, propertyKey) || initialState;
  }

  return {
    mutate: (fn: (data: T) => T) => {
      const data = fn(read());
      if (propertyKey) {
        Reflect.defineMetadata(name, data, target, propertyKey);
      } else {
        Reflect.defineMetadata(name, data, target);
      }
    },
    read,
  } as Metadata<T>
}

export const annotations = (target: any) =>
  metadata<any[]>('annotations', target, []);

export const propMetadata = (target: any) =>
  metadata<Record<string | symbol, any>>('propMetadata', target, {});

export const parameters = (target: any, propertyKey?: string | symbol) =>
  metadata<any[]>('parameters', target, [], propertyKey);

function decorate(target: any, annotation: any) {
  annotations(target).mutate(data => data.concat(annotation));
}

function decorateProperty(target: object, propertyKey: string, annotation: any) {
  propMetadata(target.constructor).mutate(props =>
    Object.assign(props, {[propertyKey]: (props[propertyKey] || []).concat(annotation)}));
  decorate(target.constructor, annotation);
}

export function classDecorator<T>(
  factory: (target: Newable<any>) => any
): ClassDecorator<T> {
  return target => {
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
    parameters(target.constructor, propertyKey)
      .mutate(p => p.concat(factory({target, propertyKey, parameterIndex})));
}
