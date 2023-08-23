import {annotations, parameters, propMetadata} from './decoration.js';
import {Constructor} from './interfaces.js';

export type StaticThis<T> = { new (...args: any[]): T };

function ofInstance<T>(cls: StaticThis<T>, annotations: any[] = []) {
  return annotations.filter(a => a instanceof cls);
}

/**
 * Annotation base class.
 */
export class Annotation {
  /**
   * Get all instances of this annotation on a given class.
   *
   * @param ctr The class to get annotations on.
   * @param inherit If true, also get annotations on all base classes. (default: false)
   */
  public static onClass<T extends Annotation>(
    this: StaticThis<T>, ctr: Function | Constructor<any>, inherit?: boolean): T[]
  {
    return ofInstance(this, annotations(ctr).read(inherit));
  }

  /**
   * Get all instances of this annotation on a given class property.
   *
   * @param ctr The class to get annotations on.
   * @param key The name of the property.
   */
  public static onProperty<T extends Annotation>(
    this: StaticThis<T>, ctr: Function | Constructor<any>, key: string): T[]
  {
    return ofInstance(this, propMetadata(ctr).read(true)[key]);
  }

  /**
   * Get all instances of this annotation on the parameters of a given class method.
   *
   * If no method is given, annotations on the constructor parameters will be returned.
   *
   * @param ctr The class to get annotations on.
   * @param methodName The name of the method.
   */
  public static onParameters<T extends Annotation>(
    this: StaticThis<T>, ctr: Function | Constructor<any>, methodName?: string): T[]
  {
    return ofInstance(this, methodName
      ? parameters(ctr, methodName).read(true)
      : parameters(ctr.constructor).read(true)
    );
  }

  /**
   * Check if a given class is decorated with this annotation.
   *
   * @param ctr The class to check.
   * @param inherit If true, also check all base classes. (default: false)
   */
  public static existsOnClass<T extends Annotation>(
    this: StaticThis<T>, ctr: Function | Constructor<any>, inherit?: boolean): boolean
  {
    return ofInstance(this, annotations(ctr).read(inherit)).length > 0;
  }
}
