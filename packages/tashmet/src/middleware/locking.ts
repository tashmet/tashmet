import {Cursor, Middleware} from '../interfaces';

export function lockedCursor<T = any>(cursor: Cursor<T>, lock: Promise<any>): Cursor<T> {
  return new Proxy(cursor, {
    get: (target, propKey) => {
      if (['toArray', 'next', 'foreach'].includes(propKey.toString())) {
        return async (...args: any[]) => {
          await lock;
          return (target as any)[propKey].apply(target, args)
        }
      } else {
        return (...args: any[]) => (target as any)[propKey].apply(target, args);
      }
    },
  });
}

export const locked = (locks: Promise<any>[]) => () => {
  const resolveLocks = async () => {
    await Promise.all(locks);
    locks.splice(0, locks.length);
  }

  const handler = (next: (...args: any[]) => Promise<any>) => async (...args: any[]) => {
    await resolveLocks();
    return next(...args);
  }

  return {
    write: handler,
    findOne: handler,
    find: next => (filter, options) => lockedCursor(next(filter, options), resolveLocks()),
    aggregate: next => pipeline => lockedCursor(next(pipeline), resolveLocks()),
  } as Middleware;
}