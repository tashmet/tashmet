import {model, number, string} from '@ziggurat/mushdamma';

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
    return Reflect.getOwnMetadata('mushdamma:model', this.constructor).name;
  }
}
