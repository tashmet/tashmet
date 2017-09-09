import {TypeDecorator} from './common';
import {IsBoolean} from 'class-validator';

export class BooleanTypeDecorator extends TypeDecorator<undefined> {
  public decorate(data: undefined, target: any, key: string) {
    let options: any = {};

    if (Reflect.getOwnMetadata('isimud:type', target, key) === 'array') {
      options.each = true;
    } else {
      Reflect.defineMetadata('isimud:type', 'boolean', target, key);
      super.decorate(data, target, key);
    }

    let decorators: any[] = [IsBoolean(options)];

    Reflect.decorate(decorators, target, key);
  }
}
