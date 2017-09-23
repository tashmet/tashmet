import {Injector} from '@ziggurat/tiamat';
import {Controller} from './controller';
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

export interface RoutineConfig {}

export type RoutineProvider = (injector: Injector, controller: any) => Routine | undefined;

export interface RoutineFactory<
  T extends Controller = Controller,
  U extends RoutineConfig = RoutineConfig>
{
  createRoutine(controller: T, config: U): any;
}
