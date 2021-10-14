import * as express from 'express';
import {Middleware, RequestHandlerFactory, Route, RouteMap} from './interfaces';

export function makeRoutes(routeMap: RouteMap): Route[] {
  return Object.entries(routeMap).map(([path, handlers]) =>
    ({path, handlers: handlers}));
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

async function createHandlers(middleware: Middleware, path: string): Promise<express.RequestHandler[]> {
  const handlers: express.RequestHandler[] = [];
  for (const m of (Array.isArray(middleware) ? middleware : [middleware])) {
    handlers.push(createAsyncHandler(m instanceof RequestHandlerFactory ? await m.create(path) : m));
  }
  return handlers;
}

export async function mountRoutes(r: express.Router, ...routes: Route[]): Promise<express.Router> {
  for (const route of routes) {
    const handlers = await createHandlers(route.handlers, route.path || '/')
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
