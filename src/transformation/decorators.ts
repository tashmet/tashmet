import {classDecorator, propertyDecorator, ClassAnnotation} from '@ziggurat/tiamat';
import {ExposeConfig, StringModelConfig} from './interfaces';
import {StringModelDecorator} from './validation/string';
import {ExposeDecorator} from './expose';

export const model = classDecorator<string>(
  new ClassAnnotation('isimud:model'));

export const expose = propertyDecorator<ExposeConfig>(
  new ExposeDecorator(), {
    persist: true,
    relay: true
  }
);

export const string = propertyDecorator<StringModelConfig>(
  new StringModelDecorator());
