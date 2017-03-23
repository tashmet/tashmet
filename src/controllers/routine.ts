import {injectable, provider, Activator} from '@samizdatjs/tiamat';
import {RoutineConfig} from '../interfaces';

@provider({
  for: 'tashmetu.RoutineAggregator',
  singleton: true
})
export class RoutineAggregator implements Activator<Routine<any>> {
  private routines: Routine<any>[] = [];

  public activate(routine: Routine<any>): Routine<any> {
    this.routines.push(routine);
    return routine;
  }

  public getRoutines(host: any): Routine<any>[] {
    let result: Routine<any>[] = [];

    this.routines.forEach((routine: any) => {
      let meta: RoutineConfig = Reflect.getOwnMetadata(
        'tashmetu:routine', routine.constructor);

      if (host instanceof meta.host) {
        result.push(routine);
      }
    });

    return result;
  }
}

@injectable()
export class Routine<T> {
  protected controller: T;

  public setController(controller: T): void {
    this.controller = controller;
  }
}
