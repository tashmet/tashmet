import {classDecorator, propertyDecorator, ClassAnnotation, PropertyAnnotation} from '@samizdatjs/tiamat';

export interface RouteConfig {
  path: string;
}

export const route = propertyDecorator<RouteConfig>(
  new PropertyAnnotation('tashmetu:route'));

export interface ViewConfig {
  template: string;
}

export const view = classDecorator<ViewConfig>(
  new ClassAnnotation('tashmetu:view'));
