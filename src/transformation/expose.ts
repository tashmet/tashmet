import {PropertyDecorator} from '@ziggurat/tiamat';
import {Expose} from 'class-transformer';
import {ExposeConfig} from './interfaces';

export class ExposeDecorator extends PropertyDecorator<ExposeConfig> {
  public decorate(
    data: ExposeConfig, target: any, key: string)
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
