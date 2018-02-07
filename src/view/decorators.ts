import {propertyDecorator, PropertyDecorator, propertyDecoratorOptional,
  Injector, activate} from '@ziggurat/tiamat';
import {FilterConfig} from './interfaces';
import {View} from './view';

class FilterDecorator extends PropertyDecorator<FilterConfig> {
  public decorate(
    config: FilterConfig, target: any, key: string, descriptor: PropertyDescriptor)
  {
    this.appendMeta('isimud:filter', {key, config}, target.constructor);
  }
}

export class FilterDecoratorActivator {
  @activate({
    instanceOf: View
  })
  private activateView(view: View): View {
    const filters = Reflect.getMetadata('isimud:filter', view.constructor) || [];
    for (let f of filters) {
      (<any>view)[f.key] = view.filter((<any>view)[f.key], f.config.observe);
    }
    return view;
  }
}

export const filter = propertyDecoratorOptional<FilterConfig>(
  new FilterDecorator(), {observe: []});
