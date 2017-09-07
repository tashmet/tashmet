import {PropertyDecorator} from '@ziggurat/tiamat';
import {ArrayModelConfig} from '../interfaces';
import {IsArray, IsBoolean, IsInt, IsNumber, IsString} from 'class-validator';

export class ArrayModelDecorator extends PropertyDecorator<ArrayModelConfig> {
  public decorate(data: ArrayModelConfig, target: any, key: string) {
    Reflect.defineMetadata('isimud:type', 'array', target, key);

    let decorators: any[] = [IsArray()];

    if (data && data.items) {
      decorators.push(data.items.type);
    }

    Reflect.decorate(decorators, target, key);
  }
}
