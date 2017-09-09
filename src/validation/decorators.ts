import {propertyDecoratorOptional, propertyDecoratorVoid} from '@ziggurat/tiamat';
import {ArrayModelConfig, NumberModelConfig, StringModelConfig,
  DateModelConfig} from './interfaces';
import {ModelPropertyDecorator} from './types/common';
import {AnyModelDecorator} from './types/any';
import {ArrayModelDecorator} from './types/array';
import {BooleanModelDecorator} from './types/boolean';
import {IntegerModelDecorator} from './types/integer';
import {NumberModelDecorator} from './types/number';
import {NestedModelDecorator} from './types/nested';
import {StringModelDecorator} from './types/string';
import {DateModelDecorator} from './types/date';

export const any = propertyDecoratorVoid(
  new AnyModelDecorator());

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

export const date = propertyDecoratorOptional<DateModelConfig>(
  new DateModelDecorator());
