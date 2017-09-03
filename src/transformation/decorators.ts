import {classDecorator, ClassAnnotation} from '@ziggurat/tiamat';

export const model = classDecorator<string>(
  new ClassAnnotation('isimud:model'));
