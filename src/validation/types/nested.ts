import {ModelPropertyDecorator} from './common';
import {ValidateNested} from 'class-validator';

export class NestedModelDecorator extends ModelPropertyDecorator<undefined> {
  public decorate(data: undefined, target: any, key: string) {
    let options: any = {};

    if (Reflect.getOwnMetadata('isimud:type', target, key) === 'array') {
      options.each = true;
    } else {
      Reflect.defineMetadata('isimud:type', 'nested', target, key);
      super.decorate(data, target, key);
    }

    let decorators: any[] = [ValidateNested(options)];

    Reflect.decorate(decorators, target, key);
  }
}
