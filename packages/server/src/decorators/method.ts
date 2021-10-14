import {RequestHandler} from 'express';
import {RouterAnnotation} from './middleware';
import {Route, RouteMethod, RequestHandlerFactory} from '../interfaces';

export class RouterMethodAnnotation extends RouterAnnotation {
  public constructor(
    private method: RouteMethod,
    private path: string,
    private middleware: (RequestHandler | RequestHandlerFactory)[],
    private propertyKey: string
  ) { super(); }

  public routes(controller: any): Route[] {
    return [{
      method: this.method,
      path: this.path,
      handlers: this.middleware.concat(
        (...args: any[]) => controller[this.propertyKey](...args)
      )
    }];
  }
}
