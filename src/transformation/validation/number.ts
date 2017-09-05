import {PropertyDecorator} from '@ziggurat/tiamat';
import {NumberModelConfig} from '../interfaces';
import {IsNumber, IsDivisibleBy} from 'class-validator';

export class NumberModelDecorator extends PropertyDecorator<NumberModelConfig> {
  public decorate(
    data: NumberModelConfig, target: any, key: string)
  {
    let decorators: any[] = [IsNumber()];

    if (data.multipleOf) {
      decorators.push(IsDivisibleBy(data.multipleOf));
    }

    Reflect.decorate(decorators, target, key);
  }
}
