import {Collection, Middleware, MethodMiddleware} from '../interfaces';

export type MutationType = 'insert' | 'delete' | 'replace';
export type MutationHandler = (type: MutationType, next: any, ...args: any[]) => Promise<any>;

export function mutation(handler: MutationHandler): Middleware {
  const methods: MethodMiddleware = {
    insertOne: next => (...args) => handler('insert', next, ...args),
    insertMany: next => (...args) => handler('insert', next, ...args),
    deleteOne: next => (...args) => handler('delete', next, ...args),
    deleteMany: next => (...args) => handler('delete', next, ...args),
    replaceOne: next => (...args) => handler('replace', next, ...args),
  }
  return {methods};
}

export const readOnly = (collection: Collection) => mutation(async () => {
  throw new Error(`trying to mutate read-only collection: '${collection.name}'`);
});
