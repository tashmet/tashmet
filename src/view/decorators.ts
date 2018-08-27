import {classDecorator} from '@ziggurat/meta';
import {Injector, ServiceIdentifier, SelfActivationAnnotation} from '@ziggurat/tiamat';
import {Controller} from '../database/controller';
import {Filter} from '../view/interfaces';
import {View} from '../view/view';

export class ViewOfAnnotation extends SelfActivationAnnotation<View> {
  public constructor(
    public key: ServiceIdentifier<Controller<any>>
  ) {
    super();
  }

  public activate(view: View, injector: Injector): View {
    view.setCollection(injector.get<Controller>(this.key));

    for (let viewProp of Object.keys(view)) {
      if ((<any>view)[viewProp] instanceof Filter) {
        const filter: Filter = (<any>view)[viewProp];
        (<any>view)[viewProp] = view.filter(filter);
      }
    }
    return view;
  }
}

export const viewOf = <(key: ServiceIdentifier<Controller<any>>) => any>
  classDecorator(ViewOfAnnotation);
