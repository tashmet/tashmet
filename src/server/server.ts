import * as express from 'express';
import {inject, injectable, service, Provider, Activator} from '@samizdatjs/tiamat';
import {Middleware, RouterProvider} from './interfaces';

@service({
  name: 'tashmetu.ServerActivator',
  singleton: true
})
export class ServerActivator implements Activator<Server> {
  @inject('tiamat.Provider') private provider: Provider;

  public activate(server: Server): Server {
    let config = Reflect.getOwnMetadata('tashmetu:server', server.constructor);
    if (config.middleware) {
      config.middleware.forEach((name: any) => {
        let middleware = this.provider.get<Middleware>(name);
        server.addMiddleware(middleware);
      });
    }
    if (config.routes) {
      for (let path in config.routes) {
        if (config.routes[path]) {
          if (config.routes[path] instanceof Function) {
            server.app().use(path, config.routes[path]);
          } else {
            let router = config.routes[path].createRouter(this.provider);
            server.addRouter(router, path);
          }
        }
      }
    }
    server.addRouterMethods(server);
    return server;
  }
}

@injectable()
export class Server {
  private expressApp: express.Application = express();

  public listen(port: number): void {
    this.expressApp.listen(port);
  }

  public app(): express.Application {
    return this.expressApp;
  }

  public addMiddleware(controller: Middleware): void {
    this.expressApp.use(controller.apply);
  }

  public addRouter(controller: any, path: string): void {
    let router: express.Router = express.Router();
    this.addRouterMethods(controller, router);
    this.expressApp.use(path, router);
  }

  public addRouterMethods(entity: any, _router?: express.Router) {
    let router = _router || this.expressApp;
    let methodMetadata = Reflect.getOwnMetadata(
      'tashmetu:router-method', entity.constructor
    );
    if (methodMetadata) {
      methodMetadata.forEach((metadata: any) => {
        let handler: express.RequestHandler = this.handlerFactory(entity, metadata.key);
        router.get(metadata.path, handler);
      });
    }
  }

  private handlerFactory(controller: any, key: string): express.RequestHandler {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      let result: any = controller[key](req, res, next);
      // try to resolve promise
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
}
