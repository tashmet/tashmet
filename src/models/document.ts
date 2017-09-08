import {model, expose} from '../transformation/decorators';
import {number, string} from '../validation/decorators';

@model('isimud.Document')
export class Document {
  @string()
  @expose()
  public _id = '';

  @string()
  @expose({persist: false})
  public _collection = '';

  @number()
  public _revision = 0;

  get _model(): string {
    return Reflect.getOwnMetadata('isimud:model', this.constructor);
  }
}
