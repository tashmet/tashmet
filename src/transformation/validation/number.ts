import {PropertyDecorator} from '@ziggurat/tiamat';
import {NumberModelConfig} from '../interfaces';
import {IsNumber, IsDivisibleBy, Min, Max} from 'class-validator';

export class NumberModelDecorator extends PropertyDecorator<NumberModelConfig> {
  public decorate(
    data: NumberModelConfig, target: any, key: string)
  {
    let decorators: any[] = [IsNumber()];

    if (data.multipleOf) {
      decorators.push(IsDivisibleBy(data.multipleOf));
    }
    if (data.minimum) {
      decorators.push(Min(data.minimum));
    }
    if (data.maximum) {
      decorators.push(Max(data.maximum));
    }

    Reflect.decorate(decorators, target, key);
  }
}
