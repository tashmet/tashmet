import {Logger} from '@tashmit/core';
import {MiddlewareFactory, Collection} from './interfaces';

export class LoggingMiddlewareFactory extends MiddlewareFactory {
  public constructor() {
    super('tashmit.DatabaseLogger');
  }

  public create(source: Collection) {
    return this.resolve(async (logger: Logger) => {
      logger = logger.inScope(source.name);

      const logError = (next: (...args: any[]) => Promise<any>) => async (...args: any[]) => {
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
          change: next => async change => {
            switch (change.action) {
              case 'insert':
                logger.info(`inserted ${change.data.map(d => d._id).join(',')}`);
                break;
              case 'delete':
                logger.info(`deleted ${change.data.map(d => d._id).join(',')}`);
                break;
              case 'replace':
                logger.info(`replaced ${change.data[0]._id}`)
            }
            return next(change);
          },
          error: next => async err => {
            logger.error(err.message);
            return next(err);
          }
        }
      };
    });
  }
}

export const logging = () => new LoggingMiddlewareFactory();
