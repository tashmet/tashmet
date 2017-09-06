import {PropertyDecorator} from '@ziggurat/tiamat';
import {ArrayModelConfig} from '../interfaces';
import {IsArray} from 'class-validator';

export class ArrayModelDecorator extends PropertyDecorator<ArrayModelConfig> {
  public decorate(data: ArrayModelConfig, target: any, key: string)
  {
    let decorators: any[] = [IsArray()];
    Reflect.decorate(decorators, target, key);
  }
}
