import {StringModelConfig} from '../interfaces';
import {PropertyModelDecorator} from './common';
import {IsString, MinLength, MaxLength, Matches, IsEmail} from 'class-validator';

export class StringModelDecorator extends PropertyModelDecorator {
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
    if (data.format === 'email') {
      decorators.push(IsEmail());
    }

    Reflect.decorate(decorators, target, key);

    super.decorate(data, target, key);
  }
}
