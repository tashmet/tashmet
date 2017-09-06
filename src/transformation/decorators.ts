import {classDecorator, propertyDecorator, propertyDecoratorOptional,
  propertyDecoratorVoid, ClassAnnotation} from '@ziggurat/tiamat';
import {ExposeConfig, ArrayModelConfig, NumberModelConfig,
  StringModelConfig} from './interfaces';
import {ArrayModelDecorator} from './validation/array';
import {BooleanModelDecorator} from './validation/boolean';
import {IntegerModelDecorator} from './validation/integer';
import {NumberModelDecorator} from './validation/number';
import {StringModelDecorator} from './validation/string';
import {ExposeDecorator} from './expose';

export const model = classDecorator<string>(
  new ClassAnnotation('isimud:model'));

export const expose = propertyDecoratorOptional<ExposeConfig>(
  new ExposeDecorator(), {
    persist: true,
    relay: true
  }
);

export const array = propertyDecoratorOptional<ArrayModelConfig>(
  new ArrayModelDecorator());

export const boolean = propertyDecoratorVoid(
  new BooleanModelDecorator());

export const number = propertyDecoratorOptional<NumberModelConfig>(
  new NumberModelDecorator());

export const integer = propertyDecoratorOptional<NumberModelConfig>(
  new IntegerModelDecorator());

export const string = propertyDecoratorOptional<StringModelConfig>(
  new StringModelDecorator());
