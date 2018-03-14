import {Injector, ServiceIdentifier} from '@ziggurat/tiamat';
import {Middleware} from '@ziggurat/ningal';
import {Controller} from './controller';
import {Collection} from '../interfaces';
import {Document} from '../models/document';

/**
 * Configuration for the collection decorator.
 */
export interface CollectionConfig {
  /**
   * The name of the collection.
   */
  name: string;

  /**
   * Provider of the source collection.
   *
   * The controller can have an optional source collection that documents are read from and
   * writter to such as a file on disk when server-side or a remote rest interface when the
   * controller operates in a browser.
   *
   * If no source provider is given, the controller will be a volatile memory collection.
   */
  source?: SourceProvider;

  /**
   * A list of providers of processing pipeline midddleware.
   */
  middleware?: MiddlewareProvider[];

  /**
   * Specify if the collection should be automatically populated from its source on creation.
   *
   * default: false
   */
  populate?: boolean;

  /**
   * A list of collections that must be populated before this one is.
   */
  populateAfter?: string[];
}

/**
 *
 */
export interface Database {
  collection(name: string): Collection;

  /**
   * Create a collection.
   *
   * This function will create a new instance given a provider and a configuration.
   * The provider needs to be registered in transient scope with the injector prior to
   * calling this function.
   */
  createCollection<C extends Controller<any>>(
    key: ServiceIdentifier<C>, config: CollectionConfig): C;

  on(event: string, fn: any): void;
}

export type SourceProvider = (injector: Injector, model: string) => Collection;

export type MiddlewareProvider = (injector: Injector, controller: Controller) => Middleware;
