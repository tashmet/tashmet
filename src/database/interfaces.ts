import {Injector, ServiceIdentifier} from '@ziggurat/tiamat';
import {Middleware} from '@ziggurat/ningal';
import {Controller} from './controller';
import {Collection} from '../interfaces';

/**
 * Configuration for the collection decorator.
 */
export interface CollectionConfig {
  /**
   * The name of the collection.
   */
  name: string;

  /**
   * Producer of the source collection.
   *
   * The controller can have an optional source collection that documents are read from and
   * writter to such as a file on disk when server-side or a remote rest interface when the
   * controller operates in a browser.
   *
   * If no source producer is given, the controller will be a volatile memory collection.
   */
  source?: SourceProducer;

  /**
   * A list of producers of processing pipeline midddleware.
   */
  middleware?: MiddlewareProducer[];
}

/**
 *
 */
export interface Database {
  /**
   * Get an existing collection by name.
   *
   * @param name The name of the collection.
   * @returns The instance of the collection.
   */
  collection(name: string): Collection;

  /**
   * Create a collection.
   *
   * This function will create a new instance given a provider and a configuration.
   * The provider needs to be registered in transient scope with the injector prior to
   * calling this function.
   *
   * @param key The service identifier for the provider of the collection.
   * @param config The configuration used for setting up the collection.
   * @returns An instance of the collection.
   */
  createCollection<C extends Controller<any>>(
    key: ServiceIdentifier<C>, config: CollectionConfig): C;

  on(event: string, fn: any): void;
}

export type SourceProducer = (injector: Injector, model: string) => Collection;

export type MiddlewareProducer = (injector: Injector, controller: Controller) => Middleware;
