import {Injector} from '@ziggurat/tiamat';
import {RoutineProvider, RoutineConfig, RoutineFactory} from './interfaces';
import {CollectionController} from './collection';
import {ClassType} from '../interfaces';
import * as Promise from 'bluebird';

export function routine<
  T extends CollectionController = CollectionController,
  U extends RoutineConfig = RoutineConfig> (
  factory: string, controllerClass: ClassType<T>
) {
  return (config: U): RoutineProvider => {
    return (injector: Injector, controller: any): Promise<any> => {
      return new Promise<any>((resolve, reject) => {
        if (controller instanceof controllerClass) {
          resolve(injector.get<RoutineFactory<T, U>>(factory).createRoutine(controller, config));
        } else {
          reject();
        }
      });
    };
  };
}
