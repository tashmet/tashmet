import {classDecorator, TaggedClassAnnotation} from '@ziggurat/tiamat';
import {ControllerDecorator} from './writers';

/**
 *
 */
export interface ControllerConfig {
  /**
   * The name of the controller.
   */
  name: string;

  model?: string;
}

export interface CollectionConfig extends ControllerConfig {
  populateAfter?: string[];
}

export const collection = classDecorator<CollectionConfig>(
  new ControllerDecorator('isimud:collection', ['isimud.Collection']), {
    model: 'isimud.Document',
    populateAfter: []
  });

export interface RoutineConfig {
  appliesTo: string[];
}

export const routine = classDecorator<RoutineConfig>(
  new TaggedClassAnnotation('isimud:routine', ['isimud.Routine']));
