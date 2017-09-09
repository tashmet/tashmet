import {propertyDecoratorOptional, propertyDecoratorVoid} from '@ziggurat/tiamat';
import {ArrayTypeConfig, NumberTypeConfig, StringTypeConfig,
  DateTypeConfig} from './interfaces';
import {TypeDecorator} from './types/common';
import {AnyTypeDecorator} from './types/any';
import {ArrayTypeDecorator} from './types/array';
import {BooleanTypeDecorator} from './types/boolean';
import {IntegerTypeDecorator} from './types/integer';
import {NumberTypeDecorator} from './types/number';
import {NestedTypeDecorator} from './types/nested';
import {StringTypeDecorator} from './types/string';
import {DateTypeDecorator} from './types/date';

export const any = propertyDecoratorVoid(
  new AnyTypeDecorator());

export const array = propertyDecoratorOptional<ArrayTypeConfig>(
  new ArrayTypeDecorator());

export const boolean = propertyDecoratorVoid(
  new BooleanTypeDecorator());

export const number = propertyDecoratorOptional<NumberTypeConfig>(
  new NumberTypeDecorator());

export const integer = propertyDecoratorOptional<NumberTypeConfig>(
  new IntegerTypeDecorator());

export const nested = propertyDecoratorVoid(
  new NestedTypeDecorator());

export const string = propertyDecoratorOptional<StringTypeConfig>(
  new StringTypeDecorator());

export const date = propertyDecoratorOptional<DateTypeConfig>(
  new DateTypeDecorator());
