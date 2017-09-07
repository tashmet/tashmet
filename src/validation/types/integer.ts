import {NumberModelDecorator} from './number';
import {NumberModelConfig} from '../interfaces';
import {IsInt} from 'class-validator';

export class IntegerModelDecorator extends NumberModelDecorator {
  public decorate(data: NumberModelConfig, target: any, key: string) {
    let options: any = {};

    if (Reflect.getOwnMetadata('isimud:type', target, key) === 'array') {
      options.each = true;
    } else {
      Reflect.defineMetadata('isimud:type', 'integer', target, key);
    }

    let decorators: any[] = [IsInt(options)];
    Reflect.decorate(decorators, target, key);
    super.decorate(data, target, key);
  }
}
