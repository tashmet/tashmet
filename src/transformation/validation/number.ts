import {PropertyDecorator} from '@ziggurat/tiamat';
import {NumberModelConfig} from '../interfaces';
import {IsNumber} from 'class-validator';

export class NumberModelDecorator extends PropertyDecorator<NumberModelConfig> {
  public decorate(
    data: NumberModelConfig, target: any, key: string)
  {
    let decorators: any[] = [IsNumber()];

    Reflect.decorate(decorators, target, key);
  }
}
