import {classDecorator, TaggedClassAnnotation} from '@ziggurat/tiamat';
import {ViewConfig} from './interfaces';

export const view = classDecorator<ViewConfig>(
  new TaggedClassAnnotation('isimud:view', ['isimud.View']));
