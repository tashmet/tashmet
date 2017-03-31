import {classDecorator, propertyDecorator} from '@samizdatjs/tiamat';
import {CollectionConfig, DocumentConfig, RoutineConfig} from './interfaces';

export function collection(config: CollectionConfig): any {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:provider', {
      for: config.providerFor,
      singleton: true
    }, target);

    if (config.schema) {
      let parentSchemas = Reflect.getMetadata('tashmetu:schemas', target) || [];
      let schemas = parentSchemas.slice();
      schemas.push(config.schema);
      Reflect.defineMetadata('tashmetu:schemas', schemas, target);
    } else {
      Reflect.defineMetadata('tashmetu:schemas', [], target);
    }

    Reflect.defineMetadata('tashmetu:collection', config, target);
  };
}

export function document(config: DocumentConfig): any {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:provider', {
      for: config.providerFor,
      singleton: true,
      tagged: ['tashmetu.Document']
    }, target);
    Reflect.defineMetadata('tashmetu:document', config, target);
  };
}

export function routine(config: RoutineConfig): any {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:provider', {
      for: config.providerFor,
      singleton: true,
      tagged: ['tashmetu.Routine']
    }, target);
    Reflect.defineMetadata('tashmetu:routine', config, target);
  };
}

export interface RouteConfig {
  path: string;
}

export const route = propertyDecorator<RouteConfig>('tashmetu:route');

export interface ViewConfig {
  template: string;
}

export const view = classDecorator<ViewConfig>('tashmetu:view');
