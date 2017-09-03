import {StringConfig} from '../interfaces';
import {ModelPropertyDecorator} from './common';
import {IsString} from 'class-validator';

export class StringDecorator extends ModelPropertyDecorator {
  public decorate(
    data: StringConfig, target: any, key: string)
  {
    this.pushDecorator(IsString());

    super.decorate(data, target, key);
  }
}
