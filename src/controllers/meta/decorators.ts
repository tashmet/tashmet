import {classDecorator, propertyDecorator, PropertyMeta} from '@samizdatjs/tiamat';
import {CollectionDecorator, HookDecorator} from './writers';
import {ProviderFor, ProviderDecorator} from '../../meta';

/**
 *
 */
export interface ControllerConfig extends ProviderFor {
  /**
   * An optional json schema that will be used for validating and providing
   * default values to documents managed by this controller.
   */
  schema?: any;
}

export interface CollectionConfig extends ControllerConfig {}

export const collection = classDecorator<CollectionConfig>(
  new CollectionDecorator('tashmetu:collection'));

export interface DocumentConfig extends ControllerConfig {
  /**
   * The name of the document.
   */
  name: string;

  /**
   * The provider id of the collection that this document belongs to.
   */
  collection: string;
}

export const document = classDecorator<DocumentConfig>(
  new ProviderDecorator('tashmetu:document', ['tashmetu.Document']));


export interface RoutineConfig extends ProviderFor {
  host: any;
}

export const routine = classDecorator<RoutineConfig>(
  new ProviderDecorator('tashmetu:routine', ['tashmetu.Routine']));

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
  pipe: string;
}

export interface HookMeta extends PropertyMeta<HookConfig> {
  type: string;
}

export const before = propertyDecorator<HookConfig>(new HookDecorator('before'));

export const after = propertyDecorator<HookConfig>(new HookDecorator('after'));

export const error = propertyDecorator<HookConfig>(new HookDecorator('error'));
