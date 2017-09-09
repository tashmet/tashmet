import {ModelPropertyDecorator} from './common';

export class AnyModelDecorator extends ModelPropertyDecorator<undefined> {
  public decorate(data: undefined, target: any, key: string) {
    if (Reflect.getOwnMetadata('isimud:type', target, key) !== 'array') {
      super.decorate(data, target, key);
    }
  }
}
