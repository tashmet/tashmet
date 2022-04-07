import {omit} from 'lodash';
import {Duplex, Pipe} from '../interfaces';
import {Disperser, FilterTransform, PipeTransform, Reducer} from '../transform';

export const chain = (pipes: Pipe[]): Pipe => async (data: any) => {
  let res = data;
  for (const pipe of pipes) {
    res = await pipe(res);
  }
  return res;
};

export function onKey<T extends object, U, K extends keyof T>(key: K, pipe: Pipe): Pipe<T, U> {
  return async (data: any) => Object.assign(data, {[key]: await pipe(data[key])});
}

export function input<In, Out>(...transforms: Duplex[]): Pipe<In, Out> {
  return chain(transforms.map(t => t.input));
}

export function output<In, Out>(...transforms: Duplex[]): Pipe<In, Out> {
  return chain(transforms.map(t => t.output).reverse());
}

export function conditional<In, Out>(condition: boolean, pipe: Pipe<In, Out>): Pipe<In, In | Out> {
  return async data => {
    if (condition) {
      return pipe(data);
    }
    return data;
  }
}

export function identity<T>(): Pipe<T> { return async data => data; }

export function omitKeys<T extends object, K extends (string | number | symbol)[]>(...keys: K):
  Pipe<T, Pick<T, Exclude<keyof T, K[number]>>>
{
  return async obj => omit(obj, keys) as any;
}

export function pipe<In = any, Out = any>(pipe: Pipe<In, Out>) { return new PipeTransform(pipe); }

export function filter<T>(test: Pipe<T, boolean>) { return new FilterTransform<T>(test); }

export function reduce<In, Out>(fn: (acc: Out, value: In) => Out, initial: Out) {
  return new Reducer<In, Out>(fn, initial);
}

export function collect<T>() {
  return reduce<T, T[]>((acc, value) => {
    acc.push(value);
    return acc;
  }, []);
}

export function disperse<T>() { return new Disperser<T>(); }
