import {getType} from 'reflect-helper';
import {Constructor} from './interfaces';

export type StaticThis<T> = { new (...args: any[]): T };

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
    return getType(ctr).getAnnotations(this, inherit);
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
    return getType(ctr).getProperty(key).getAnnotations(this);
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
    if (!methodName) {
      return (Reflect.getMetadata('parameters', ctr) || [])
        .reduce((acc: any[], val: any) => acc.concat(val), []);
    }

    let annotations: T[] = [];
    const method = getType(ctr).methods.find(m => m.name === methodName);
    if (method) {
      for (let param of method.parameters) {
        annotations = annotations.concat(param.getAnnotations().filter(a => a instanceof this));
      }
    }
    return annotations;
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
    return getType(ctr).hasAnnotation(this, inherit);
  }
}
