import {TypeDecorator} from './common';
import {ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';

export class NestedTypeDecorator extends TypeDecorator<any> {
  public decorate(data: any, target: any, key: string) {
    let options: any = {};

    if (Reflect.getOwnMetadata('isimud:type', target, key) === 'array') {
      options.each = true;
    } else {
      Reflect.defineMetadata('isimud:type', 'nested', target, key);
      super.decorate(data, target, key);
    }

    let decorators: any[] = [ValidateNested(options), Type(() => data)];

    Reflect.decorate(decorators, target, key);
  }
}
