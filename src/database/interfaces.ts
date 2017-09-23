import {Injector} from '@ziggurat/tiamat';
import {Controller} from './controller';
import {Collection} from '../interfaces';
import {Routine} from '../processing/interfaces';
import * as Promise from 'bluebird';

/**
 *
 */
export interface CollectionConfig {
  /**
   * The name of the collection.
   */
  name: string;

  model?: string;

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
