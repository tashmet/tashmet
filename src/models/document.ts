import {model, number, string} from '../schema/decorators';

@model({
  name: 'isimud.Document'
})
export class Document {
  @string() public _id = '';

  @string() public _collection = '';

  @number() public _revision = 0;

  public constructor(id = '') {
    this._id = id;
  }

  get _model(): string {
    return Reflect.getOwnMetadata('isimud:model', this.constructor).name;
  }
}
