import {
  Collection,
  CollectionChangeAction,
  Document,
  Middleware,
  withMiddleware,
  mutationSideEffect,
  locked,
  DatabaseChange,
} from '@tashmit/database';

export type BufferWrite = (change: DatabaseChange) => Promise<void>;

export function buffer<TSchema extends Document>(
  cache: Collection<TSchema>, lock: Promise<void>, write: BufferWrite
) {
  return withMiddleware<TSchema>(cache, [locked([lock]), writer(write)]);
}

export function changeObserver<T>(handler: (change: DatabaseChange) => Promise<void>) {
  return (collection: Collection<T>) => {
    const handle = (action: CollectionChangeAction, data: any[]) =>
      handler({action, data, collection});

    return {
      insertOne: mutationSideEffect(async (result, doc) => {
        if (result.insertedId !== undefined) {
          await handle('insert', [doc]);
        }
      }),
      insertMany: mutationSideEffect(async (result, docs) => {
        if (result.insertedCount > 0) {
          await handle('insert', docs);
        }
      }),
      deleteOne: next => async filter => {
        const match = await collection.findOne(filter);
        const result = await next(filter);
        if (result.deletedCount > 0) {
          await handle('delete', [match]);
        }
        return result;
      },
      deleteMany: next => async filter => {
        const matching = await collection.find(filter).toArray();
        const result = await next(filter);
        if (result.deletedCount > 0) {
          await handle('delete', matching);
        }
        return result;
      },
      replaceOne: next => async (filter, doc, options) => {
        const original = await collection.findOne(filter);
        const result = await next(filter, doc, options);
        if (result.modifiedCount === 0 && result.upsertedCount === 0) {
          return result;
        }
        const replacement = await collection.findOne({_id: result.upsertedId || (original as any)._id})
        if (result.upsertedCount > 0) {
          await handle('insert', [replacement]);
        } else if(original) {
          await handle('replace', [original, replacement]);
        }
        return result;
      }
    } as Middleware;
  }
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

