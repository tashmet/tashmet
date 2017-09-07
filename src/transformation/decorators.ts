import {classDecorator, propertyDecoratorOptional, ClassAnnotation} from '@ziggurat/tiamat';
import {ExposeConfig} from './interfaces';
import {ExposeDecorator} from './expose';

export const model = classDecorator<string>(
  new ClassAnnotation('isimud:model'));

export const expose = propertyDecoratorOptional<ExposeConfig>(
  new ExposeDecorator(), {
    persist: true,
    relay: true
  }
);
