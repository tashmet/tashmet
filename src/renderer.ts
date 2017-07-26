import {provider} from '@ziggurat/tiamat';
import * as mustache from 'mustache';

@provider({
  for: 'isimud.Renderer',
  singleton: true
})
export class MustacheRenderer {
  public render(view: any): string {
    let meta = Reflect.getMetadata('isimud:view', view.constructor);
    return mustache.render(meta.template, view);
  }
}
