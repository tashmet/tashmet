import {PropertyDecorator} from '@ziggurat/tiamat';
import {ArrayModelConfig} from '../interfaces';
import {IsArray, ArrayMinSize, ArrayMaxSize} from 'class-validator';

export class ArrayModelDecorator extends PropertyDecorator<ArrayModelConfig> {
  public decorate(data: ArrayModelConfig, target: any, key: string) {
    Reflect.defineMetadata('isimud:type', 'array', target, key);

    let decorators: any[] = [IsArray()];

    if (data) {
      if (data.items) {
        decorators.push(data.items.type);
      }
      if (data.minItems) {
        decorators.push(ArrayMinSize(data.minItems));
      }
      if (data.maxItems) {
        decorators.push(ArrayMaxSize(data.maxItems));
      }
    }

    Reflect.decorate(decorators, target, key);
  }
}
