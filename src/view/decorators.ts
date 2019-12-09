import {classDecorator, Newable, FactoryProviderAnnotation} from '@ziggurat/tiamat';
import {Database} from '../interfaces';
import {Filter, View} from './view';

export class ViewOfAnnotation extends FactoryProviderAnnotation<View> {
  public inject = ['ziggurat.Database'];

  public constructor(
    private collectionName: string,
    private target: Newable<View>
  ) {
    super(target);
  }

  public create(database: Database) {
    let view = new this.target(database.collection(this.collectionName));

    for (let viewProp of Object.keys(view)) {
      if ((<any>view)[viewProp] instanceof Filter) {
        const filter: Filter = (<any>view)[viewProp];
        (<any>view)[viewProp] = view.filter(filter);
      }
    }
    return view;
  }
}

/**
 * Link to collection.
 *
 * Decorate a view to attach it to a collection given its name.
 */
export const viewOf = <(collectionName: string) => any>
  classDecorator(ViewOfAnnotation);
