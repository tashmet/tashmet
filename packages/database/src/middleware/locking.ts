import {Middleware} from '../interfaces';

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
    aggregate: handler,
    insertOne: handler,
    insertMany: handler,
    deleteOne: handler,
    deleteMany: handler,
    replaceOne: handler,
    findOne: handler,
    find: next => (filter, options) => new Proxy(next(filter, options), {
      get: (target, propKey) => {
        if (['toArray', 'next', 'foreach'].includes(propKey.toString())) {
          return async (...args: any[]) => {
            await resolveLocks();
            return (target as any)[propKey].apply(target, args)
          }
        } else {
          return (...args: any[]) => (target as any)[propKey].apply(target, args);
        }
      },
    })
  } as Middleware;
}