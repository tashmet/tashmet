import {
  Collection,
  Document,
  withMiddleware,
  changeObserver,
  DatabaseChange,
  Middleware
} from '@tashmit/database';

export type BufferWrite = (change: DatabaseChange) => Promise<void>;

export function buffer<TSchema extends Document>(
  cache: Collection<TSchema>, lock: Promise<void>, write: BufferWrite
) {
  return withMiddleware<TSchema>(cache, [locked(lock), writer(write)]);
}

export const writer = <TSchema>(write: BufferWrite) => changeObserver<TSchema>(async change => {
  const {action, data, collection} = change;

  const rollback = () => {
    switch (action) {
      case 'insert': return collection.deleteMany({_id: {$in: data.map(d => d._id)}});
      case 'delete': return collection.insertMany(data);
      case 'replace': return collection.replaceOne({_id: data[1]}, data[0]);
    }
  }

  try {
    await write(change);
  } catch (err) {
    await rollback();
  }
});

export const locked = (lock: Promise<any>) => () => {
  const handler = (next: (...args: any[]) => Promise<any>) => async (...args: any[]) => {
    await lock;
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
            await lock;
            return (target as any)[propKey].apply(target, args)
          }
        } else {
          return (...args: any[]) => (target as any)[propKey].apply(target, args);
        }
      },
    })
  } as Middleware;
}
