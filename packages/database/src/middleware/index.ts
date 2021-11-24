import {Collection, Document, Middleware} from '../interfaces';
import {changeObserver} from './changeObserver';

export {changeObserver};
export {logging} from './logging';
export * from './mutation';
export * from './validation';

const middlewareMethods = new Set<string | symbol | number>([
  'insertOne',
  'insertMany',
  'deleteOne',
  'deleteMany',
  'replaceOne',
  'aggregate',
  'findOne',
  'find',
]);

export function withMiddleware<TSchema extends Document = Document, T extends Collection<TSchema> = Collection<TSchema>>(
  collection: T,
  middleware: (Middleware | ((collection: T) => Middleware))[],
): T {
  if (middleware.length === 0) {
    return collection;
  }

  const [current, ...rest] = middleware.slice(0).reverse().map(
    m => typeof m === 'function' ? m(collection) : m
  );

  return withMiddleware<TSchema, T>(new Proxy(collection, {
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

export const autoEvent = () => changeObserver(async change => {
  //change.collection.emit('change', change);
});

/*
export function withAutoEvent<T, TSchema>(collection: Collection<T>) {
  return withMiddleware<T>(collection, [autoEvent()]);
}
*/
