import {RequestHandler} from 'express';
import onHeaders from 'on-headers';
import {Logger} from '@tashmit/core';
import {RequestHandlerFactory} from './interfaces';

export class RequestLoggerFactory extends RequestHandlerFactory {
  public constructor() {
    super('server.Logger');
  }

  public create(): Promise<RequestHandler> {
    return this.resolve(async (logger: Logger) => {
      return (req, res, next) => {
        onHeaders(res, () => {
          const url = decodeURIComponent(req.originalUrl);
          logger.info(`${req.method} '${url}' ${res.statusCode}`);
        });
        next();
      }
    });
  }
}

export const requestLogger = () => new RequestLoggerFactory();
