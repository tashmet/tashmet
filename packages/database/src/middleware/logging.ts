import {Factory, Logger} from '@tashmit/core';
import {Middleware, MiddlewareFactory} from '../interfaces';
import {mutation} from './mutation';

const loggingMiddleware = (logger: Logger) => {
  const logError = mutation(async (type, next, ...args) => {
    try {
      return await next(...args);
    } catch (err) {
      logger.error(err.message);
      throw (err);
    }
  });

  return {
    methods: logError.methods,
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
  } as Middleware;
}

export function logging(): MiddlewareFactory {
  return Factory.of(({container, collection}) =>
    loggingMiddleware(container.resolve(Logger.inScope(`database.${collection.name}`)))
  );
}
