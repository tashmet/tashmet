import {Injector} from '@ziggurat/tiamat';
import {Routine} from '@ziggurat/ningal';
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


export interface DatabaseConfig {
  sources: {[name: string]: Function};

  routines?: RoutineProvider[];

  /**
   * Specify if collections should be automatically populated from their sources on creation.
   *
   * When set to true all of them are populated. If this attribute is a list of IDs,
   * then only those collections are affected.
   *
   * default: false
   */
  populate?: boolean | string[];
}

export interface RoutineConfig {}

export type RoutineProvider = (injector: Injector, controller: any) => Routine | undefined;

export interface RoutineFactory<
  T extends Controller = Controller,
  U extends RoutineConfig = RoutineConfig>
{
  createRoutine(controller: T, config: U): any;
}
