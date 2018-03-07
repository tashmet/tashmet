import {classDecorator, ClassAnnotation, ServiceIdentifier,
  Abstract, Newable} from '@ziggurat/tiamat';

export const viewOf = classDecorator<ServiceIdentifier<any>>(
  new ClassAnnotation('isimud:viewOf'));
