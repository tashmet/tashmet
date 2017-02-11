import {ServerConfig, RouterMethodMetadata, HandlerDecorator} from './interfaces';

export function server(config: ServerConfig) {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:service', {
      name: 'tashmetu.Server',
      singleton: true,
      activator: 'tashmetu.ServerActivator'
    }, target);
    Reflect.defineMetadata('tashmetu:server', config, target);
  };
}

export function router(name: string) {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:service', {name}, target);
  };
}

export function get(path: string): HandlerDecorator {
  return method('get', path);
}

function method(method: string, path: string): HandlerDecorator {
  return function (target: any, key: string, value: any) {
    let metadata: RouterMethodMetadata = {path, method, target, key};
    let metadataList: RouterMethodMetadata[] = [];

    if (!Reflect.hasOwnMetadata('tashmetu:router-method', target.constructor)) {
        Reflect.defineMetadata('tashmetu:router-method', metadataList, target.constructor);
    } else {
        metadataList = Reflect.getOwnMetadata('tashmetu:router-method', target.constructor);
    }

    metadataList.push(metadata);
  };
}
