import {mutationSideEffect} from './mutation';
import {
  CollectionChangeAction,
  DatabaseChange,
  Middleware,
} from '../interfaces';
import {Collection} from '../collection';


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
