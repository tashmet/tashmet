import {PropertyDecorator} from '@ziggurat/tiamat';
import {IsBoolean} from 'class-validator';

export class BooleanModelDecorator extends PropertyDecorator<undefined> {
  public decorate(data: undefined, target: any, key: string) {
    let decorators: any[] = [IsBoolean()];

    Reflect.decorate(decorators, target, key);
  }
}
