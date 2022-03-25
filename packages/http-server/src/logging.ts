/*
import * as express from 'express';
import onHeaders from 'on-headers';
import {Factory, Logger} from '@tashmet/core';
import {RequestHandlerFactory} from './interfaces';

export function requestLogger(): RequestHandlerFactory {
  return Factory.of(({container}) => {
    const logger = container.resolve(Logger.inScope('server'));

    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      onHeaders(res, () => {
        const url = decodeURIComponent(req.originalUrl);
        logger.info(`${req.method} '${url}' ${res.statusCode}`);
      });
      next();
    }
  });
}
*/
