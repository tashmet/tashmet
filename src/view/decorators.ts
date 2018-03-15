import {classDecorator, ClassAnnotation, ServiceIdentifier,
  Abstract, Newable} from '@ziggurat/tiamat';
import {Controller} from '../database/controller';

export const viewOf = classDecorator<ServiceIdentifier<Controller<any>>>(
  new ClassAnnotation('isimud:viewOf'));
