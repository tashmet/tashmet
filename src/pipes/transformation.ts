import {Pipe} from '@ziggurat/ningal';
import {Transformer} from '@ziggurat/mushdamma';
import * as Promise from 'bluebird';

/**
 * Pipe that turns plain objects into instances of the model they reference.
 */
export class InstancePipe implements Pipe {
  public constructor(
    private transformer: Transformer,
    private mode: string,
    private model: string
  ) {}

  public process(input: any): Promise<any> {
    return this.transformer.toInstance(input, this.mode, this.model);
  }
}

/**
 * Pipe that turns instances into plain objects according to thier model.
 */
export class PlainPipe implements Pipe {
  public constructor(
    private transformer: Transformer,
    private mode: string
  ) {}

  public process(input: any): Promise<any> {
    return this.transformer.toPlain(input, this.mode);
  }
}
