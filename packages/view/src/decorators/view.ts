import {FactoryProviderAnnotation} from '@ziqquratu/ioc';
import {classDecorator, Newable} from '@ziqquratu/reflection';
import {Database} from '@ziqquratu/database';
import {View} from '../view';

export interface ViewConfig {
  /** The name of the collection used by the view */
  collection: string;

  /**
   * An optional list of names of properties that should be monitored for changes.
   *
   * If a change occurs to a property on the decorated view with a name present in this list
   * a refresh of the view will happen automatically.
   */
  monitor?: string[];
}

export class ViewAnnotation extends FactoryProviderAnnotation<View<any>> {
  public inject = ['ziqquratu.Database'];

  public constructor(
    private config: ViewConfig,
    private target: Newable<View<any>>
  ) {
    super(target);
  }

  public create(database: Database) {
    return new Proxy(new this.target(database.collection(this.config.collection)), {
      set: (target, key, value): boolean => {
        (target as any)[key] = value;
        if ((this.config.monitor || []).indexOf(key as string) !== -1) {
          target.refresh();
        }
        return true;
      }
    });
  }
}

/**
 * Turns a class into a provider of a view.
 *
 * Decorate a view to attach it to a collection given its name.
 */
export const view = (config: ViewConfig) =>
  classDecorator<View<any>>(target => new ViewAnnotation(config, target));
