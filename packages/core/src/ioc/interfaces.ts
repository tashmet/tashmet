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
   * Register a resolver used for retrieving instances of T for a given service identifier,
   */
  register<T>(provider: Provider<T> | Newable<T>): void;

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

export type ServiceRequest<T> = ServiceIdentifier<T> | Resolver<T>;

export interface FactoryContext {
  container: Container;
}

export class Factory<T, TContext = {}> extends Resolver<(context: TContext) => T> {
  public static of<T, TContext>(fn: (context: TContext & FactoryContext) => T) {
    return new Factory<T, TContext>(fn);
  }

  public constructor(
    private fn: (context: TContext & FactoryContext) => T
  ) { super(); }

  public resolve(container: Container): (context: TContext) => T {
    return context => {
      return this.fn({...context, container});
    }
  }
}

export class AsyncFactory<T, TContext = {}> extends Factory<Promise<T>, TContext> {}
