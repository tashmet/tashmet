import {classDecorator, propertyDecorator, ClassAnnotation, PropertyAnnotation} from '@ziggurat/tiamat';

export interface RouteConfig {
  path: string;
}

export const route = propertyDecorator<RouteConfig>(
  new PropertyAnnotation('isimud:route'));

export interface ViewConfig {
  template: string;
}

export const view = classDecorator<ViewConfig>(
  new ClassAnnotation('isimud:view'));
