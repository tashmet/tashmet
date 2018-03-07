import {Injector} from '@ziggurat/tiamat';
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
   * Base model that the collection will use for its documents.
   *
   * All documents in the collection must conform to this model or any other model that
   * inherits from it.
   *
   * default: isimud.Document
   */
  model?: string;

  source?: SourceProvider;

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

  on(event: string, fn: any): void;
}

export type SourceProvider = (injector: Injector, model: string) => Collection;

export type MiddlewareProvider = (injector: Injector, controller: Controller) => Middleware;
