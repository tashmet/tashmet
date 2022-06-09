/*
import {Document, Middleware, Store} from '../interfaces';

//export {logging} from './logging';
export * from './mutation';
export * from './validation';
// export * from './locking';

const middlewareMethods = new Set<string | symbol | number>([
  'write',
  'aggregate',
  'findOne',
  'find',
]);

export function withMiddleware<TSchema extends Document = Document, TStore extends Store<TSchema> = Store<TSchema>>(
  store: TStore,
  middleware: (Middleware | ((store: TStore) => Middleware))[],
): TStore {
  if (middleware.length === 0) {
    return store;
  }

  const [current, ...rest] = middleware.slice(0).reverse().map(
    m => typeof m === 'function' ? m(store) : m
  );

  return withMiddleware<TSchema, TStore>(new Proxy(store, {
    get: (target, propKey) => {
      if (propKey in current && middlewareMethods.has(propKey)) {
        const next = (target as any)[propKey].bind(target);
        return (...args: any[]) => (current as any)[propKey](next)(...args);
      } else {
        return (target as any)[propKey];
      }
    }
  }), rest);
}
*/
