import {classDecorator, propertyDecorator} from '@samizdatjs/tiamat';

export interface RouteConfig {
  path: string;
}

export const route = propertyDecorator<RouteConfig>('tashmetu:route');

export interface ViewConfig {
  template: string;
}

export const view = classDecorator<ViewConfig>('tashmetu:view');
