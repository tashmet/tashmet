import {PropertyDecorator} from '@ziggurat/tiamat';
import {DateModelConfig} from '../interfaces';
import {IsDate} from 'class-validator';

export class DateModelDecorator extends PropertyDecorator<DateModelConfig> {
  public decorate(data: DateModelConfig, target: any, key: string) {
    let options: any = {};

    if (Reflect.getOwnMetadata('isimud:type', target, key) === 'array') {
      options.each = true;
    } else {
      Reflect.defineMetadata('isimud:type', 'date', target, key);
    }

    let decorators: any[] = [IsDate(options)];

    Reflect.decorate(decorators, target, key);
  }
}
