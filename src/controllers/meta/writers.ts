import {PropertyMeta, PropertyDecorator,
  TaggedClassAnnotation} from '@samizdatjs/tiamat';
import {CollectionConfig, HookConfig, HookMeta} from './decorators';
import {uniq} from 'lodash';

export class ControllerDecorator extends TaggedClassAnnotation<CollectionConfig> {
  public decorate(data: CollectionConfig, target: any) {
    let parentMeta = Reflect.getMetadata('tashmetu:collection', target);
    if (parentMeta) {
      if (parentMeta.populateAfter) {
        data.populateAfter = uniq(
          (data.populateAfter || []).concat(parentMeta.populateAfter));
      }
    }

    if (data.schema) {
      let parentSchemas = Reflect.getMetadata('tashmetu:schemas', target) || [];
      let schemas = parentSchemas.slice();
      schemas.push(data.schema);
      Reflect.defineMetadata('tashmetu:schemas', schemas, target);
    } else {
      Reflect.defineMetadata('tashmetu:schemas', [], target);
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
    this.appendMeta('tashmetu:hook', meta, target.constructor);
  }
}
