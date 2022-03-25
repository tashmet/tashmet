import {Annotation} from '@tashmet/core';
import {Route, RouteMap} from '../interfaces';
import {makeRoutes} from '../routing';

export class RouterAnnotation extends Annotation {
  public routes(controller: any): Route[] {
    return [];
  }
}

export class MiddlewareAnnotation extends RouterAnnotation {
  public constructor(
    private config: RouteMap
  ) { super(); }

  public routes(controller: any) {
    return makeRoutes(this.config);
  }
}
