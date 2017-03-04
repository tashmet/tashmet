import {CollectionConfig} from './interfaces';

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

export function content(config: any): any {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:provider', {
      for: 'tashmetu.Content',
      singleton: true,
      autoCreate: true,
      activator: 'tashmetu.Database'
    }, target);
    Reflect.defineMetadata('tashmetu:content', config, target);
  };
}

export function document(config: any): any {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:provider', {
      for: config.providerFor,
      singleton: true
    }, target);
    Reflect.defineMetadata('tashmetu:document', config, target);
  };
}

export function routine(config: any): any {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:provider', {
      for: config.providerFor,
      singleton: true,
      activator: 'tashmetu.RoutineAggregator'
    }, target);
    Reflect.defineMetadata('tashmetu:routine', config, target);
  };
}

export function before(config: any): any {
  return function (target: any, key: string, value: any) {
    let metadata: any = {type: 'before', config, target, key};
    pushMetaData('tashmetu:collection-hook', metadata, target.constructor);
  };
}

export function after(config: any): any {
  return function (target: any, key: string, value: any) {
    let metadata: any = {type: 'after', config, target, key};
    pushMetaData('tashmetu:collection-hook', metadata, target.constructor);
  };
}

export function error(config: any): any {
  return function (target: any, key: string, value: any) {
    let metadata: any = {type: 'error', config, target, key};
    pushMetaData('tashmetu:collection-hook', metadata, target.constructor);
  };
}

function pushMetaData(name: string, data: any, target: any) {
  let metadataList: any[] = [];

  if (!Reflect.hasOwnMetadata(name, target)) {
      Reflect.defineMetadata(name, metadataList, target);
  } else {
      metadataList = Reflect.getOwnMetadata(name, target);
  }

  metadataList.push(data);
}
