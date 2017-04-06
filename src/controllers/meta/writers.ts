import {PropertyMeta, PropertyDecorator} from '@samizdatjs/tiamat';
import {CollectionConfig, HookConfig, HookMeta} from './decorators';
import {ProviderDecorator, TaggedClassAnnotation} from '../../meta';

export class CollectionDecorator extends TaggedClassAnnotation<CollectionConfig> {
  public decorate(data: CollectionConfig, target: any) {
    super.decorate(data, target);

    if (data.schema) {
      let parentSchemas = Reflect.getMetadata('tashmetu:schemas', target) || [];
      let schemas = parentSchemas.slice();
      schemas.push(data.schema);
      Reflect.defineMetadata('tashmetu:schemas', schemas, target);
    } else {
      Reflect.defineMetadata('tashmetu:schemas', [], target);
    }
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
