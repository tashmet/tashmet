import {Logger} from '@ziqquratu/core';
import {MiddlewareFactory, Collection, ReplaceOneOptions} from './interfaces';

export class LoggingMiddlewareFactory extends MiddlewareFactory {
  public constructor() {
    super('ziqquratu.DatabaseLogger');
  }

  public create(source: Collection) {
    return this.resolve((logger: Logger) => {
      logger = logger.inScope(source.name);

      function log<T>(fn: (result: T, ...input: any[]) => void) {
        return async (next: (...args: any[]) => Promise<T>, ...args: any[]) => {
          try {
            const result = await next(...args);
            fn(result, ...args);
            return result;
          } catch (err) {
            logger.error(err.message);
            throw (err);
          }
        }
      }

      function onInsertOne(doc: any) {
        logger.debug(`inserted '${doc._id}'`);
      }

      function onInsertMany(docs: any[]) {
        docs.forEach(onInsertOne);
      }

      function onReplaceOne(doc: any, selector: any, replacement: any, options: ReplaceOneOptions | undefined) {
        logger.debug(`replaced '${doc._id}'`);
      }
  
      function onDeleteOne(doc: any, selector: any) {
        logger.debug(`deleted '${doc._id}'`);
      }

      function onDeleteMany(docs: any[], selector: any) {
        docs.forEach(onDeleteOne);
      }

      return {
        methods: {
          insertOne: log(onInsertOne),
          insertMany: log(onInsertMany),
          replaceOne: log(onReplaceOne),
          deleteOne: log(onDeleteOne),
          deleteMany: log(onDeleteMany),
        }
      };
    });
  }
}

export const logging = () => new LoggingMiddlewareFactory();
