import {Pipe} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import * as Promise from 'bluebird';

/**
 * A series of pipes.
 */
export class Pipeline extends EventEmitter implements Pipe {
  private steps: {[name: string]: Pipe} = {};
  private sequence: Pipe[] = [];

  public constructor(private emitErrors?: boolean) {
    super();
  }

  public step(name: string, pipe: Pipe): Pipeline {
    this.steps[name] = pipe;
    return this.push(pipe);
  }

  public push(pipe: Pipe): Pipeline {
    this.sequence.push(pipe);
    return this;
  }

  public getStep(name: string): Pipe {
    return this.steps[name];
  }

  get length(): number {
    return this.sequence.length;
  }

  public process(input: any): Promise<any> {
    let result = input;

    return Promise.each(this.sequence, (pipe: Pipe) => {
      return pipe.process(result).then((output: any) => {
        result = output;
      });
    })
    .then(() => {
      return result;
    })
    .catch((err: any) => {
      if (this.emitErrors) {
        this.emit('document-error', err);
      }
      return Promise.reject(err);
    });
  }
}
