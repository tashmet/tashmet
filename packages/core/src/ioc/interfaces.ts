import {Abstract, Newable} from '../reflection';
import {Provider} from './provider';

export type ServiceIdentifier<T> = (string | symbol | Newable<T> | Abstract<T>);

/**
 * Container for registering and resolving services.
 */
export declare interface Container {
  /**
   * Resolve an instance from the container given a resolver or service identifier.
   */
  resolve<T>(req: ServiceRequest<T>): T;

  /**
   *  Resolve a factory function.
   *
   * @param factory A service identifier of a factory
   */
  resolveFactory<T, TContext>(
    factory: ServiceIdentifier<Factory<T, TContext>>
  ): FactoryFunction<T, TContext>

  /**
   * Register a resolver used for retrieving instances of T for a given service identifier,
   */
  register<T>(provider: Provider<T> | Newable<T> | Plugin): void;

  /**
   * Returns true if the given service identifier has been registered.
   */
  isRegistered<T>(key: ServiceIdentifier<T>): boolean;
}

export abstract class Container implements Container {}

/**
 * A resolver is a proxy that acts on a container to solicit instances.
 */
export abstract class Resolver<T> {
  public abstract resolve(container: Container): T;
}

export type ServiceRequest<T> = ServiceIdentifier<T> | Resolver<T> | Newable<Factory<T>>;

export interface FactoryContext {
  container: Container;
}

export type FactoryFunction<T, TContext> = (context: TContext) => T;

export class Factory<T, TContext = void> extends Resolver<FactoryFunction<T, TContext>> {
  public static of<T, TContext>(fn: FactoryFunction<T, TContext & FactoryContext>) {
    return new Factory<T, TContext>(fn);
  }

  public constructor(
    private fn: FactoryFunction<T, TContext & FactoryContext>
  ) { super(); }

  public resolve(container: Container): FactoryFunction<T, TContext> {
    return context => {
      return this.fn({...context, container});
    }
  }
}

export class AsyncFactory<T, TContext = void> extends Factory<Promise<T>, TContext> {}

export abstract class Plugin {
  public abstract register(container: Container): void;
}
