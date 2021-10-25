import {classDecorator, Newable} from '../../reflection';
import {Container, ServiceRequest} from '../interfaces';
import {BootstrapAnnotation} from '../bootstrap';
import {Provider} from '../provider';

/**
 * Configuration options for component decorator.
 */
export interface ComponentConfig {
  /**
   * A list of providers (classes) that the component offers.
   */
  providers?: (Provider<any> | Newable<any>)[];

  /**
   * A list of other components that the component depends on.
   *
   * A component can be either a class constructor or a promise of a module import where the
   * default export should be the component class.
   */
  dependencies?: (Newable<any> | Promise<any>)[];

  /**
   * A list of services to inject into the constructor of the component class.
   */
  inject?: ServiceRequest<any>[];
}

class ComponentAnnotation extends BootstrapAnnotation {
  private dependencies: BootstrapAnnotation[] = [];

  public constructor(
    private config: ComponentConfig,
    private target: Newable<any>
  ) { super(); }

  public async register(container: Container): Promise<void> {
    container.register(Provider.ofClass({
      ctr: this.target,
      inject: this.config.inject
    }));

    for (const dep of this.config.dependencies || []) {
      const annotation = await this.getAnnotation(dep);
      await annotation.register(container);
      this.dependencies.push(annotation);
    }
    for (const provider of this.config.providers || []) {
      container.register(provider);
    }
  }

  public resolve<T>(container: Container): T {
    for (const dep of this.dependencies) {
      dep.resolve(container);
    }
    return container.resolve(this.target);
  }

  private async getAnnotation(dep: Newable<any> | Promise<any>): Promise<BootstrapAnnotation> {
    const ctr = dep instanceof Promise ? (await dep).default : dep;

    if (!BootstrapAnnotation.existsOnClass(ctr)) {
      throw Error('missing bootstrap annotation on component');
    }
    return BootstrapAnnotation.onClass(ctr)[0];
  }
}

/**
 * Component class decorator.
 *
 * Turns a class into a component which is a collection of providers.
 * A component can have dependencies on other components which means that it can consume whatever
 * those components provide.
 *
 * @usageNotes
 * An instance of the component is created by passing the class to the bootstrap method.
 *
 * ```typescript
 * class Printer {
 *   public output(message: string) {
 *     console.log(message);
 *   }
 * }
 *
 * @component({
 *   providers: [
 *     Printer,
 *     Provider.ofInstance('greeting', 'Hello world!')
 *   ],
 *   inject: [Printer, 'greeting']
 * })
 * class App {
 *   constructor(
 *     private printer: Printer;
 *     private greeting: string;
 *   ) {}
 *
 *   public run() {
 *     this.printer.output(this.greeting);
 *   }
 * }
 *
 * bootstrap(App).then(app => app.run());
 * ```
 */
export const component = (config: ComponentConfig = {}) =>
  classDecorator(target => new ComponentAnnotation(config, target));
