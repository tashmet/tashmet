import {Logger} from '@ziqquratu/core';
import {MiddlewareFactory, Collection} from './interfaces';

export class LoggingMiddlewareFactory extends MiddlewareFactory {
  public constructor() {
    super('ziqquratu.DatabaseLogger');
  }

  public create(source: Collection) {
    return this.resolve((logger: Logger) => {
      async function log(next: (...args: any[]) => Promise<any>, ...args: any[]): Promise<any> {
        try {
          return next(...args);
        } catch (err) {
          logger.inScope(source.name).error(err.message);
          throw (err);
        }
      }

      return {
        methods: {
          findOne: log,
          insertOne: log,
          insertMany: log,
          replaceOne: log,
          deleteOne: log,
          deleteMany: log,
        }
      };
    });
  }
}

export const logging = () => new LoggingMiddlewareFactory();
