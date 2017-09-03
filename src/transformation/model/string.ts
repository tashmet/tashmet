import {StringModelConfig} from '../interfaces';
import {PropertyModelDecorator} from './common';
import {IsString} from 'class-validator';

export class StringModelDecorator extends PropertyModelDecorator {
  public decorate(
    data: StringModelConfig, target: any, key: string)
  {
    this.pushDecorator(IsString());

    super.decorate(data, target, key);
  }
}
