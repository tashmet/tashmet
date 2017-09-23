import {Injector} from '@ziggurat/tiamat';
import {RoutineProvider, RoutineConfig, RoutineFactory} from './interfaces';
import {Controller} from './controller';
import {ClassType} from '../interfaces';
import {Routine} from '../processing/interfaces';
import * as Promise from 'bluebird';

export function controllerRoutine<
  T extends Controller = Controller,
  U extends RoutineConfig = RoutineConfig> (
  factory: string, controllerClass: ClassType<T>
) {
  return (config: U): RoutineProvider => {
    return (injector: Injector, controller: any): Routine | undefined => {
      if (controller instanceof controllerClass) {
        return injector.get<RoutineFactory<T, U>>(factory).createRoutine(controller, config);
      } else {
        return undefined;
      }
    };
  };
}
