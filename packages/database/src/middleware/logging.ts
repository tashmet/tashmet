import {Logger} from '@tashmit/core';
import {Middleware} from '../interfaces';
import {mutationSideEffect} from './mutation';


const loggingMiddleware = (logger: Logger) => {
  const handleError = (error: Error) => logger.error(error.message);

  return {
    insertOne: mutationSideEffect(({insertedId}) =>
      logger.info(`inserted ${insertedId}`), handleError
    ),
    insertMany: mutationSideEffect(({insertedIds}) =>
      logger.info(`inserted ${Object.keys(insertedIds).join(',')}`), handleError,
    ),
    deleteOne: mutationSideEffect(({deletedCount}) =>
      logger.info(`deleted ${deletedCount} document`), handleError
    ),
    deleteMany: mutationSideEffect(({deletedCount}) =>
      logger.info(`deleted ${deletedCount} documents`), handleError
    )
  } as Middleware;
}

/*
export function logging(): MiddlewareFactory {
  return Factory.of(({container, collection}) =>
    loggingMiddleware(container.resolve(Logger.inScope(`database.${collection.name}`)))
  );
}
*/
