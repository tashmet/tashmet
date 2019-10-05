import {classDecorator, Container, Newable, Abstract, AbstractProviderAnnotation} from '@ziggurat/tiamat';
import {Database} from '../interfaces';
import {Filter} from './view';

export class ViewOfAnnotation extends AbstractProviderAnnotation {
  public constructor(
    public collectionName: string,
    private target: Newable<any>
  ) {
    super(target);
  }

  public provide(container: Container) {
    container.registerSingletonFactory(this.target, (database: Database) => {
      let view = new this.target(database.collection(this.collectionName));

      for (let viewProp of Object.keys(view)) {
        if ((<any>view)[viewProp] instanceof Filter) {
          const filter: Filter = (<any>view)[viewProp];
          (<any>view)[viewProp] = view.filter(filter);
        }
      }
      return view;
    }, ['ziggurat.Database']);
  }
}

/**
 * Link to collection.
 *
 * Decorate a view to attach it to a collection given its name.
 */
export const viewOf = <(collectionName: string) => any>
  classDecorator(ViewOfAnnotation);
