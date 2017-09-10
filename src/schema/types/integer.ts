import {NumberTypeDecorator} from './number';
import {NumberTypeConfig} from '../interfaces';
import {IsInt} from 'class-validator';

export class IntegerTypeDecorator extends NumberTypeDecorator {
  public decorate(data: NumberTypeConfig, target: any, key: string) {
    super.decorate(data, target, key);

    let options: any = {};

    if (Reflect.getOwnMetadata('isimud:type', target, key) === 'array') {
      options.each = true;
    } else {
      Reflect.defineMetadata('isimud:type', 'integer', target, key);
    }

    let decorators: any[] = [IsInt(options)];
    Reflect.decorate(decorators, target, key);
  }
}
