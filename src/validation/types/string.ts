import {PropertyDecorator} from '@ziggurat/tiamat';
import {StringModelConfig} from '../interfaces';
import {IsString, MinLength, MaxLength, Matches, IsDateString, IsEmail, IsIP} from 'class-validator';

export class StringModelDecorator extends PropertyDecorator<StringModelConfig> {
  public decorate(data: StringModelConfig, target: any, key: string) {
    let options: any = {};

    if (Reflect.getOwnMetadata('isimud:type', target, key) === 'array') {
      options.each = true;
    } else {
      Reflect.defineMetadata('isimud:type', 'string', target, key);
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
      switch (data.format) {
        case 'date-time':
          decorators.push(IsDateString(options));
          break;
        case 'email':
          decorators.push(IsEmail({}, options));
          break;
        case 'ipv4':
          decorators.push(IsIP('4', options));
          break;
        case 'ipv6':
          decorators.push(IsIP('6', options));
          break;
      }
    }

    Reflect.decorate(decorators, target, key);
  }
}
