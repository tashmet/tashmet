import {PropertyDecorator} from '@ziggurat/tiamat';
import {StringModelConfig} from '../interfaces';
import {IsString, MinLength, MaxLength, Matches, IsDateString, IsEmail, IsIP} from 'class-validator';

export class StringModelDecorator extends PropertyDecorator<StringModelConfig> {
  public decorate(
    data: StringModelConfig, target: any, key: string)
  {
    let decorators: any[] = [IsString()];

    if (data.minLength) {
      decorators.push(MinLength(data.minLength));
    }
    if (data.maxLength) {
      decorators.push(MaxLength(data.maxLength));
    }
    if (data.pattern) {
      decorators.push(Matches(data.pattern));
    }
    switch (data.format) {
      case 'date-time':
        decorators.push(IsDateString());
        break;
      case 'email':
        decorators.push(IsEmail());
        break;
      case 'ipv4':
        decorators.push(IsIP('4'));
        break;
      case 'ipv6':
        decorators.push(IsIP('6'));
        break;
    }

    Reflect.decorate(decorators, target, key);
  }
}
