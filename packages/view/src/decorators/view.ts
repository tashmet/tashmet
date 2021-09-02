import {classDecorator, FactoryProviderAnnotation, Newable} from '@ziqquratu/core';
import {TrackingFactory} from '../tracker';
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
  monitorProps?: string[];

  /**
   * Listen for changes in the database that will affect the view and refresh
   * the view automatically when they happen.
   *
   * @default true
   */
  monitorDatabase?: boolean;
}

export class ViewAnnotation extends FactoryProviderAnnotation<View<any>> {
  public inject = [TrackingFactory];

  public constructor(
    private config: ViewConfig,
    private target: Newable<View<any>>
  ) {
    super(target);
  }

  public create(fact: TrackingFactory) {
    const {collection, monitorDatabase} = this.config;
    const view = new this.target(fact, collection, monitorDatabase !== false);

    return new Proxy(view, {
      set: (target, key, value): boolean => {
        (target as any)[key] = value;
        if ((this.config.monitorProps || []).indexOf(key as string) !== -1) {
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
