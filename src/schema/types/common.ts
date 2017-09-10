import {PropertyDecorator} from '@ziggurat/tiamat';

export class TypeDecorator<T> extends PropertyDecorator<T> {
  public decorate(data: T, target: any, key: string) {
    this.appendOwnMeta('isimud:modelProperty', key, target.constructor);
  }
}
