import {classDecorator, ClassAnnotation} from '@ziggurat/tiamat';

export const viewOf = classDecorator<string>(
  new ClassAnnotation('isimud:viewOf'));
