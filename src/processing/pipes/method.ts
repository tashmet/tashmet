import {Pipe} from '../interfaces';
import * as Promise from 'bluebird';

/**
 * Pipe that passes data through a method on a given target object.
 */
export class MethodPipe implements Pipe {
  public constructor(private target: any, private method: string) {}

  public process(input: any): Promise<any> {
    return this.target[this.method].call(this.target, input);
  }
}
