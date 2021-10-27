import {
  Collection,
  CollectionChangeAction,
  DatabaseChange,
  Middleware,
} from '../interfaces';


export const changeObserver = (handler: (change: DatabaseChange) => Promise<void>) => (collection: Collection) => {
  const handle = (action: CollectionChangeAction, data: any[]) =>
    handler({action, data, collection});

  const observeChange = (action: CollectionChangeAction) => {
    return (next: any) => async (...args: any[]) => {
      const result = await next(...args);
      if (result) {
        await handle(action, Array.isArray(result) ? result : [result]);
      }
      return result;
    }
  }

  return {
    methods: {
      insertOne: observeChange('insert'),
      insertMany: observeChange('insert'),
      deleteOne: observeChange('delete'),
      deleteMany: observeChange('delete'),
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