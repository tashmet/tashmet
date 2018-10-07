import {getType} from 'reflect-helper';
import {model, number, string, ModelAnnotation} from '@ziggurat/amelatu';

@model({
  name: 'isimud.Document',
  exclude: {
    _id: 'persist',
    _collection: 'persist',
    _revision: 'persist'
  }
})
export class Document {
  @string() public _id = '';

  @string() public _collection = '';

  @number() public _revision = 0;

  public constructor(id = '') {
    this._id = id;
  }

  get _model(): string {
    return getType(this.constructor).getAnnotations(ModelAnnotation)[0].name;
  }
}
