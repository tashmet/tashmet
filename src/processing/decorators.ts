import {propertyDecorator, PropertyDecorator} from '@ziggurat/tiamat';
import {HookConfig, HookMeta} from './interfaces';

class HookDecorator extends PropertyDecorator<HookConfig> {
  public constructor(private type: string) {
    super();
  }

  public decorate(data: HookConfig, target: any, key: string) {
    let meta: HookMeta = {target, key, type: this.type, data};
    this.appendMeta('isimud:hook', meta, target.constructor);
  }
}

export const before = propertyDecorator<HookConfig>(new HookDecorator('before'));

export const after = propertyDecorator<HookConfig>(new HookDecorator('after'));

export const error = propertyDecorator<HookConfig>(new HookDecorator('error'));
