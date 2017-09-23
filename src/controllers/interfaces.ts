import {Injector} from '@ziggurat/tiamat';
import {CollectionController} from './collection';
import * as Promise from 'bluebird';

/**
 *
 */
export interface CollectionConfig {
  /**
   * The name of the controller.
   */
  name: string;

  model?: string;

  populateAfter?: string[];
}

export interface RoutineConfig {}

export type RoutineProvider = (injector: Injector, controller: any) => Promise<any>;

export interface RoutineFactory<
  T extends CollectionController = CollectionController,
  U extends RoutineConfig = RoutineConfig>
{
  createRoutine(controller: T, config: U): any;
}
