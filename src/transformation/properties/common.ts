import {PropertyDecorator} from '@ziggurat/tiamat';
import {Expose} from 'class-transformer';
import {ModelPropertyConfig} from '../interfaces';

export class ModelPropertyDecorator extends PropertyDecorator<ModelPropertyConfig> {
  private decorators: any[] = [];

  protected pushDecorator(d: any) {
    this.decorators.push(d);
  }

  public decorate(
    data: ModelPropertyConfig, target: any, key: string)
  {
    let groups = [];
    if (data.relay) {
      groups.push('relay');
    }
    if (data.persist) {
      groups.push('persist');
    }
    this.pushDecorator(Expose({groups: groups}));

    Reflect.decorate(this.decorators, target, key);
  }
}
