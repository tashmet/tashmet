import {CollectionConfig, StreamConfig} from './interfaces';

export function collection(config: CollectionConfig): any {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:service', {
      name: config.name,
      singleton: true,
      activator: 'tashmetu.Database'
    }, target);
    Reflect.defineMetadata('tashmetu:collection', config, target);
  };
}

export function stream(config: StreamConfig): any {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:service', {
      name: config.name,
      singleton: true,
      activator: 'tashmetu.StreamActivator'
    }, target);
    Reflect.defineMetadata('tashmetu:stream', config, target);
  };
}

export function document(config: any): any {
  return function (target: any) {
    Reflect.defineMetadata('tiamat:service', {
      name: config.name,
      singleton: true,
      autoCreate: true,
      activator: 'tashmetu.Database'
    }, target);
    Reflect.defineMetadata('tashmetu:document', config, target);
  };
}

export function before(step: string): any {
  return function (target: any, key: string, value: any) {
    let metadata: any = {type: 'before', step, target, key};
    pushMetaData('tashmetu:collection-hook', metadata, target.constructor);
  };
}

export function after(step: string): any {
  return function (target: any, key: string, value: any) {
    let metadata: any = {type: 'after', step, target, key};
    pushMetaData('tashmetu:collection-hook', metadata, target.constructor);
  };
}

export function error(step: string): any {
  return function (target: any, key: string, value: any) {
    let metadata: any = {type: 'error', step, target, key};
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
