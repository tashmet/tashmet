import {classDecorator, propertyDecorator, PropertyMeta,
  TaggedClassAnnotation} from '@ziggurat/tiamat';
import {ControllerDecorator, HookDecorator} from './writers';

/**
 *
 */
export interface ControllerConfig {
  /**
   * The name of the controller.
   */
  name: string;

  /**
   * An optional json schema that will be used for validating and providing
   * default values to documents managed by this controller.
   */
  schema?: any;
}

export interface CollectionConfig extends ControllerConfig {
  populateAfter?: string[];
}

export const collection = classDecorator<CollectionConfig>(
  new ControllerDecorator('isimud:collection', ['isimud.Collection']), {
    populateAfter: []
  });

export interface DocumentConfig extends ControllerConfig {
  /**
   * The provider id of the collection that this document belongs to.
   */
  collection: string;
}

export const document = classDecorator<DocumentConfig>(
  new ControllerDecorator('isimud:document', ['isimud.Document']));


export interface RoutineConfig {
  appliesTo: string[];
}

export const routine = classDecorator<RoutineConfig>(
  new TaggedClassAnnotation('isimud:routine', ['isimud.Routine']));

/**
 * Input for hook decorators (before, after and error).
 */
export interface HookConfig {
  /**
   * The name of the step that the hook applies to.
   */
  step: string;

  /**
   * The name of the pipe that the hook applies to.
   */
  pipe?: string;
}

export interface HookMeta extends PropertyMeta<HookConfig> {
  type: string;
}

export const before = propertyDecorator<HookConfig>(new HookDecorator('before'));

export const after = propertyDecorator<HookConfig>(new HookDecorator('after'));

export const error = propertyDecorator<HookConfig>(new HookDecorator('error'));
