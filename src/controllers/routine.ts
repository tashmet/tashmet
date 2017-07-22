import {injectable, provider, activate, ProviderConfig} from '@samizdatjs/tiamat';
import {Collection} from '../interfaces';
import {RoutineConfig} from './meta/decorators';
import {intersection} from 'lodash';

@provider({
  for: 'tashmetu.RoutineAggregator',
  singleton: true
})
export class RoutineAggregator {
  private routines: Routine<any>[] = [];

  @activate('tashmetu.Routine')
  public addRoutine(routine: Routine<any>): Routine<any> {
    this.routines.push(routine);
    return routine;
  }

  public getRoutines(collection: Collection): Routine<any>[] {
    let result: Routine<any>[] = [];
    let tags = this.getTags(collection);

    this.routines.forEach((routine: any) => {
      let meta: RoutineConfig = Reflect.getOwnMetadata(
        'tashmetu:routine', routine.constructor);

      if (intersection(tags, meta.appliesTo).length > 0) {
        result.push(routine);
      }
    });

    return result;
  }

  private getTags(collection: any): string[] {
    return Reflect.getMetadata('tiamat:tags', collection.constructor) || [];
  }
}

@injectable()
export class Routine<T> {
  protected controller: T;

  public setController(controller: T): void {
    this.controller = controller;
  }
}
