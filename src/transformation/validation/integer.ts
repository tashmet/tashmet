import {NumberModelDecorator} from './number';
import {NumberModelConfig} from '../interfaces';
import {IsInt} from 'class-validator';

export class IntegerModelDecorator extends NumberModelDecorator {
  public decorate(
    data: NumberModelConfig, target: any, key: string)
  {
    let decorators: any[] = [IsInt()];
    Reflect.decorate(decorators, target, key);
    super.decorate(data, target, key);
  }
}
