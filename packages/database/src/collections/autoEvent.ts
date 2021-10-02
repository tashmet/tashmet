import {Collection, Filter} from '../interfaces';

export abstract class AutoEventCollection<T = any> extends Collection<T> {
  public constructor(suppress: boolean = false) {
    super();
    return suppress ? this : new Proxy(this, {
      get: function(target, property) {
        const emitChange = (action: string, data: any[]) =>
          target.emit('change', {collection: target, action, data});

        const observeChange = (methodName: string, action: string) => {
          return async (...args: any[]) => {
            const result = await (target as any)[methodName](...args);
            if (result) {
              emitChange(action, Array.isArray(result) ? result : [result]);
            }
            return result;
          }
        }

        switch(property) {
          case 'insertOne':
          case 'insertMany':
            return observeChange(property, 'insert');
          case 'deleteOne':
          case 'deleteMany':
            return observeChange(property, 'delete');
          case 'replaceOne': return async (filter: Filter<T>, doc: any, options: any) => {
            const original = await target.findOne(filter);
            const replacement = await target.replaceOne(filter, doc, options);
            if (!original && replacement) {
              emitChange('insert', [replacement]);
            } else if(original) {
              emitChange('replace', [original, replacement]);
            }
            return replacement;
          }
        }
        return (target as any)[property];
      }
    });
  }
}
