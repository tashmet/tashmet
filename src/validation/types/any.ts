import {TypeDecorator} from './common';

export class AnyTypeDecorator extends TypeDecorator<undefined> {
  public decorate(data: undefined, target: any, key: string) {
    if (Reflect.getOwnMetadata('isimud:type', target, key) !== 'array') {
      super.decorate(data, target, key);
    }
  }
}
