import {PropertyMeta, PropertyDecorator,
  TaggedClassAnnotation} from '@ziggurat/tiamat';
import {CollectionConfig, HookConfig, HookMeta} from './decorators';
import {uniq} from 'lodash';

export class ControllerDecorator extends TaggedClassAnnotation<CollectionConfig> {
  public decorate(data: CollectionConfig, target: any) {
    let parentMeta = Reflect.getMetadata('isimud:collection', target);
    if (parentMeta) {
      if (parentMeta.populateAfter) {
        data.populateAfter = uniq(
          (data.populateAfter || []).concat(parentMeta.populateAfter));
      }
    }

    if (data.schema) {
      let parentSchemas = Reflect.getMetadata('isimud:schemas', target) || [];
      let schemas = parentSchemas.slice();
      schemas.push(data.schema);
      Reflect.defineMetadata('isimud:schemas', schemas, target);
    } else {
      Reflect.defineMetadata('isimud:schemas', [], target);
    }

    super.decorate(data, target);
  }
}

export class HookDecorator extends PropertyDecorator<HookConfig> {
  public constructor(private type: string) {
    super();
  }

  public decorate(data: HookConfig, target: any, key: string) {
    let meta: HookMeta = {target, key, type: this.type, data};
    this.appendMeta('isimud:hook', meta, target.constructor);
  }
}
