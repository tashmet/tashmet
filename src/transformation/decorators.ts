import {classDecorator, propertyDecoratorOptional, ClassAnnotation} from '@ziggurat/tiamat';
import {ExposeConfig} from './interfaces';
import {ExposeDecorator} from './expose';
import {Type} from 'class-transformer';

export const model = classDecorator<string>(
  new ClassAnnotation('isimud:model'));

export const expose = propertyDecoratorOptional<ExposeConfig>(
  new ExposeDecorator(), {
    persist: true,
    relay: true
  }
);

export const type = Type;
