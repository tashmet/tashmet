import {Logger} from '@ziqquratu/core';
import {MiddlewareFactory, Collection} from './interfaces';

export class LoggingMiddlewareFactory extends MiddlewareFactory {
  public constructor() {
    super('ziqquratu.DatabaseLogger');
  }

  public create(source: Collection) {
    return this.resolve(async (logger: Logger) => {
      logger = logger.inScope(source.name);

      const logError = async (next: (...args: any[]) => Promise<any>, ...args: any[]) => {
        try {
          return await next(...args);
        } catch (err) {
          logger.error(err.message);
          throw (err);
        }
      }

      return {
        methods: {
          insertOne: logError,
          insertMany: logError,
          replaceOne: logError,
          deleteOne: logError,
          deleteMany: logError,
        },
        events: {
          'document-upserted': async (next, doc) => {
            logger.info(`upserted '${doc._id}'`);
            return next(doc);
          },
          'document-removed': async (next, doc) => {
            logger.info(`deleted '${doc._id}'`);
            return next(doc);
          },
          'document-error': async (next, err) => {
            logger.error(err.message);
            return next(err);
          }
        }
      };
    });
  }
}

export const logging = () => new LoggingMiddlewareFactory();
