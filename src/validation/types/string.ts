import {StringModelConfig} from '../interfaces';
import {ModelPropertyDecorator} from './common';
import {IsString, MinLength, MaxLength, Matches, IsDateString, IsEmail, IsIP} from 'class-validator';

export class StringModelDecorator extends ModelPropertyDecorator<StringModelConfig> {
  public decorate(data: StringModelConfig, target: any, key: string) {
    let options: any = {};

    if (Reflect.getOwnMetadata('isimud:type', target, key) === 'array') {
      options.each = true;
    } else {
      Reflect.defineMetadata('isimud:type', 'string', target, key);
      super.decorate(data, target, key);
    }

    let decorators: any[] = [IsString(options)];

    if (data) {
      if (data.minLength) {
        decorators.push(MinLength(data.minLength, options));
      }
      if (data.maxLength) {
        decorators.push(MaxLength(data.maxLength, options));
      }
      if (data.pattern) {
        decorators.push(Matches(data.pattern, options));
      }
      if (data.format) {
        decorators.push(this.getFormatDecorator(data.format, options));
      }
    }

    Reflect.decorate(decorators, target, key);
  }

  private getFormatDecorator(format: string, options: any): any {
    switch (format) {
      case 'date-time': return IsDateString(options);
      case 'email': return IsEmail({}, options);
      case 'ipv4': return IsIP('4', options);
      case 'ipv6': return IsIP('6', options);
    }
  }
}
