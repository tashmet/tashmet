import {model, expose} from '../transformation/decorators';
import {number, string} from '../validation/decorators';

@model('isimud.Document')
export class Document {
  @string()
  @expose({persist: false})
  public _id = '';

  @string()
  @expose({persist: false})
  public _collection = '';

  @string()
  @expose()
  public _model = 'isimud.Document';

  @number()
  public _revision: number;
}
