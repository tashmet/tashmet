import {propertyDecoratorOptional, propertyDecoratorVoid} from '@ziggurat/tiamat';
import {ArrayModelConfig, NumberModelConfig, StringModelConfig} from './interfaces';
import {ArrayModelDecorator} from './types/array';
import {BooleanModelDecorator} from './types/boolean';
import {IntegerModelDecorator} from './types/integer';
import {NumberModelDecorator} from './types/number';
import {NestedModelDecorator} from './types/nested';
import {StringModelDecorator} from './types/string';

export const array = propertyDecoratorOptional<ArrayModelConfig>(
  new ArrayModelDecorator());

export const boolean = propertyDecoratorVoid(
  new BooleanModelDecorator());

export const number = propertyDecoratorOptional<NumberModelConfig>(
  new NumberModelDecorator());

export const integer = propertyDecoratorOptional<NumberModelConfig>(
  new IntegerModelDecorator());

export const nested = propertyDecoratorVoid(
  new NestedModelDecorator());

export const string = propertyDecoratorOptional<StringModelConfig>(
  new StringModelDecorator());
