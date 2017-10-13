import {Injector} from '@ziggurat/tiamat';
import {Routine} from '@ziggurat/ningal';
import {RoutineProvider, RoutineConfig, RoutineFactory} from './interfaces';
import {Controller} from './controller';
import {ClassType} from '../interfaces';
import {transform} from 'lodash';

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

export function createRoutines(
  providers: RoutineProvider[], controller: Controller, injector: Injector): Routine[]
{
  return transform(providers, (routines: Routine[], provider) => {
    const routine = provider(injector, controller);
    if (routine) {
      routines.push(routine);
    }
  }, []);
}
