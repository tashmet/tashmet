import {
  Collection,
  CollectionChangeAction,
  DatabaseChange,
  Middleware,
} from '../interfaces';


export const changeObserver = (handler: (change: DatabaseChange) => Promise<void>) => (collection: Collection) => {
  const handle = (action: CollectionChangeAction, data: any[]) =>
    handler({action, data, collection});

  return {
    methods: {
      insertOne: next => async doc => {
        const result = await next(doc);
        if (result.insertedId !== undefined) {
          await handle('insert', [doc]);
        }
        return result;
      },
      insertMany: next => async docs => {
        const result = await next(docs);
        if (result.insertedCount > 0) {
          await handle('insert', docs);
        }
        return result;
      },
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
        const replacement = await next(filter, doc, options);
        if (!original && replacement) {
          await handle('insert', [replacement]);
        } else if(original) {
          await handle('replace', [original, replacement]);
        }
        return replacement;
      }
    }
  } as Middleware;
}
