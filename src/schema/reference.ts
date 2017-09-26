import {propertyDecorator, PropertyAnnotation} from '@ziggurat/tiamat';
import {string} from '@ziggurat/mushdamma';

export class ReferenceTypeDecorator extends PropertyAnnotation<string> {
  public constructor() {
    super('isimud:reference');
  }

  public decorate(data: string, target: any, key: string, descriptor: PropertyDescriptor) {
    super.decorate(data, target, key, descriptor);

    const decorators: any[] = [string()];
    Reflect.decorate(decorators, target, key);
  }
}

export const reference = propertyDecorator<string>(
  new ReferenceTypeDecorator());
