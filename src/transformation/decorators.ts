import {classDecorator, propertyDecorator, ClassAnnotation} from '@ziggurat/tiamat';
import {PropertyModelConfig, StringModelConfig} from './interfaces';
import {StringModelDecorator} from './model/string';

const defaultPropertyModelConfig: PropertyModelConfig = {
  persist: true,
  relay: true
};

export const model = classDecorator<string>(
  new ClassAnnotation('isimud:model'));

export const string = propertyDecorator<StringModelConfig>(
  new StringModelDecorator(), defaultPropertyModelConfig);
