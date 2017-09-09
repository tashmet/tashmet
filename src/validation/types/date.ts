import {ModelPropertyDecorator} from './common';
import {DateModelConfig} from '../interfaces';
import {IsDate, MinDate, MaxDate} from 'class-validator';
import {Type} from 'class-transformer';

export class DateModelDecorator extends ModelPropertyDecorator<DateModelConfig> {
  public decorate(data: DateModelConfig, target: any, key: string) {
    let options: any = {};

    if (Reflect.getOwnMetadata('isimud:type', target, key) === 'array') {
      options.each = true;
    } else {
      Reflect.defineMetadata('isimud:type', 'date', target, key);
      super.decorate(data, target, key);
    }

    let decorators: any[] = [IsDate(options), Type(() => Date)];

    if (data) {
      if (data.min) {
        decorators.push(MinDate(data.min, options));
      }
      if (data.max) {
        decorators.push(MaxDate(data.max, options));
      }
    }

    Reflect.decorate(decorators, target, key);
  }
}
