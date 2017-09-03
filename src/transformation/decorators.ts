import {classDecorator, propertyDecorator, ClassAnnotation} from '@ziggurat/tiamat';
import {StringConfig} from './interfaces';
import {StringDecorator} from './properties/string';

export const model = classDecorator<string>(
  new ClassAnnotation('isimud:model'));

export const string = propertyDecorator<StringConfig>(
  new StringDecorator());
