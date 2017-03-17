import {provider} from '@samizdatjs/tiamat';
import * as mustache from 'mustache';

@provider({
  for: 'tashmetu.Renderer',
  singleton: true
})
export class MustacheRenderer {
  public render(view: any): string {
    let meta = Reflect.getMetadata('tashmetu:view', view.constructor);
    return mustache.render(meta.template, view);
  }
}
