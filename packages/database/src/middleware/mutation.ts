import {Collection, Middleware, MiddlewareHook} from '../interfaces';

export type MutationType = 'insert' | 'delete' | 'replace';
export type MutationHandler = (type: MutationType, next: any, ...args: any[]) => Promise<any>;

export function mutation(handler: MutationHandler): Middleware {
  return {
    insertOne: next => (...args) => handler('insert', next, ...args),
    insertMany: next => (...args) => handler('insert', next, ...args),
    deleteOne: next => (...args) => handler('delete', next, ...args),
    deleteMany: next => (...args) => handler('delete', next, ...args),
    replaceOne: next => (...args) => handler('replace', next, ...args),
  }
}

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

export const readOnly = (collection: Collection) => mutation(async () => {
  throw new Error(`trying to mutate read-only collection: '${collection.name}'`);
});
