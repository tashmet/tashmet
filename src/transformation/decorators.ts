import {classDecorator, propertyDecorator, ClassAnnotation} from '@ziggurat/tiamat';
import {ExposeConfig, NumberModelConfig, StringModelConfig} from './interfaces';
import {IntegerModelDecorator} from './validation/integer';
import {NumberModelDecorator} from './validation/number';
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

export const number = propertyDecorator<NumberModelConfig>(
  new NumberModelDecorator());

export const integer = propertyDecorator<NumberModelConfig>(
  new IntegerModelDecorator());

export const string = propertyDecorator<StringModelConfig>(
  new StringModelDecorator());
