import * as express from 'express';
import {Middleware, Route, RouteMap} from './interfaces';

export function makeRoutes(routeMap: RouteMap): Route[] {
  return Object.entries(routeMap).map(([path, handlers]) =>
    ({path, handlers: Array.isArray(handlers) ? handlers : [handlers]}));
}

function createAsyncHandler(handler: express.RequestHandler): express.RequestHandler  {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const result: any = handler(req, res, next);
    if (result && result instanceof Promise) {
      result.then((value: any) => {
        if (value && !res.headersSent) {
          res.send(value);
        }
      })
      .catch((error: any) => {
        next(error);
      });
    } else if (result && !res.headersSent) {
      res.send(result);
    }
  };
}

function createHandlers(middleware: Middleware[]): express.RequestHandler[] {
  const handlers: express.RequestHandler[] = [];
  for (const m of middleware) {
    handlers.push(createAsyncHandler(m));
  }
  return handlers;
}

export function mountRoutes(r: express.Router, ...routes: Route[]): express.Router {
  for (const route of routes) {
    const handlers = createHandlers(route.handlers)
    if (route.method) {
      (r as any)[route.method](route.path, handlers);
    } else if (route.path) {
      r.use(route.path, handlers);
    } else {
      r.use(handlers);
    }
  }
  return r;
}
