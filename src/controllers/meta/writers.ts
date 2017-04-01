import {PropertyMeta, PropertyMetaWriter} from '@samizdatjs/tiamat';
import {CollectionConfig, HookConfig, HookMeta} from './decorators';
import {ProviderMetaWriter} from '../../meta';

export class CollectionMetaWriter extends ProviderMetaWriter {
  public write(data: CollectionConfig, target: any) {
    super.write(data, target);

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

export class HookMetaWriter extends PropertyMetaWriter<HookConfig> {
  public constructor(private type: string) {
    super();
  }

  public write(data: HookConfig, target: any, key: string) {
    let meta: HookMeta = {target, key, type: this.type, data};
    this.append('tashmetu:hook', meta, target.constructor);
  }
}
