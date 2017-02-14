import {Provider} from '@samizdatjs/tiamat';
import * as express from 'express';

export interface ServerConfig {
  routes?: any;

  middleware?: string[];
}

export interface RouterMetadata {
  path: string;
  target: any;
}

export interface RouterMethodMetadata extends RouterMetadata {
  method: string;
  key: string;
}

export interface HandlerDecorator {
  (target: any, key: string, value: any): void;
}

export interface Middleware {
  apply(req: express.Request, res: express.Response, next: express.NextFunction): void;
}

/**
 *
 */
export interface RouterProvider {
  createRouter(provider: Provider): any;
}
