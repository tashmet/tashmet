import {PropertyDecorator} from '@ziggurat/tiamat';
import {IsBoolean} from 'class-validator';

export class BooleanModelDecorator extends PropertyDecorator<undefined> {
  public decorate(data: undefined, target: any, key: string) {
    let options: any = {};

    if (Reflect.getOwnMetadata('isimud:type', target, key) === 'array') {
      options.each = true;
    } else {
      Reflect.defineMetadata('isimud:type', 'boolean', target, key);
    }

    let decorators: any[] = [IsBoolean(options)];

    Reflect.decorate(decorators, target, key);
  }
}
