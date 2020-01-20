import {Annotation, Newable, classDecorator} from '@ziqquratu/reflection';
import {ServiceIdentifier, ServiceRequest} from '../interfaces';
import {ClassProviderConfig, FactoryProviderConfig, InjectedProviderConfig} from '../provider';

export abstract class InjectedProviderAnnotation<T>
  extends Annotation implements InjectedProviderConfig<T>
{
  public inject: ServiceRequest<any>[] = [];
  public transient = false;

  public constructor(
    public key: ServiceIdentifier<T>,
  ) { super(); }
}

export class ClassProviderAnnotation<T>
  extends InjectedProviderAnnotation<T> implements ClassProviderConfig<T>
{
  public constructor(
    config: InjectedProviderConfig<T>,
    public ctr: Newable<T>
  ) {
    super(config.key || ctr);
    Object.assign(this, config);
  }
}

export class FactoryProviderAnnotation<T>
  extends InjectedProviderAnnotation<T> implements FactoryProviderConfig<T>
{
  public create(...args: any[]): T {
    throw Error('Create method not implemented on factory annotation');
  }
}

/**
 * Provider class decorator.
 *
 * Turns a class into a provider for a given service identifier.
 *
 * @usageNotes
 * The provider decorator allows us to associate a class with a service identifier so that
 * we can inject it elsewhere without knowing the concrete implementation.
 *
 * ```typescript
 * interface Logger {
 *   public log(message: string);
 * }
 *
 * @provider({key: 'Logger'})
 * class PlainLogger {
 *   public log(message: string) {
 *     console.log(message);
 *   }
 * }
 *```
 *
 * After registering the PlainLogger above it can be injected using its service identifier.
 *
 * ```typescript
 * @provider({
 *   inject: ['Logger']
 * })
 * class Foo {
 *   constructor(
 *     private logger: Logger;
 *   ) {}
 * }
 * ```
 */
export const provider = (config: InjectedProviderConfig<any> = {}) =>
  classDecorator(target => new ClassProviderAnnotation(config, target));
