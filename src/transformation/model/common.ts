import {PropertyDecorator} from '@ziggurat/tiamat';
import {Expose} from 'class-transformer';
import {PropertyModelConfig} from '../interfaces';

export class PropertyModelDecorator extends PropertyDecorator<PropertyModelConfig> {
  public decorate(
    data: PropertyModelConfig, target: any, key: string)
  {
    let groups = [];
    if (data.relay) {
      groups.push('relay');
    }
    if (data.persist) {
      groups.push('persist');
    }
    let decorators: any[] = [Expose({groups: groups})];

    Reflect.decorate(decorators, target, key);
  }
}
