import {Middleware, MiddlewareHook, Store} from '../interfaces';

export type SideEffectFunction<T> = (result: T, ...args: any[]) => void | Promise<void>;

export function mutationSideEffect<T>(success: SideEffectFunction<T>, fail?: SideEffectFunction<Error>): MiddlewareHook<(...args: any[]) => Promise<T>> {
  return next => async (...args: []) => {
    try {
      const result = await next(...args);
      const sideEffect = success(result, ...args);
      if (sideEffect instanceof Promise) {
        await sideEffect;
      }
      return result;
    } catch (err) {
      fail ? fail(err, ...args) : undefined;
      throw err;
    }
  }
}

export const readOnly = (store: Store<any>) => ({
  write: () => {
    throw new Error(`trying to mutate read-only collection: '${store.ns.coll}'`);
  }
}) as Middleware;
