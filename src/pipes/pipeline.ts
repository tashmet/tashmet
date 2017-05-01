import {Pipe} from '../interfaces';
import {EventEmitter} from '../util';

let eachSeries = require('async-each-series');

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

  public process(input: any, next: (output: any) => void): void {
    let result = input;

    eachSeries(this.sequence, (pipe: Pipe, done: any) => {
      pipe.process(result, (output: any) => {
        if (output instanceof Error) {
          done(output);
        } else {
          result = output;
          done();
        }
      });
    }, (err: any) => {
      if (!err) {
        next(result);
      } else {
        if (this.emitErrors) {
          this.emit('document-error', err);
        }
        next(err);
      }
    });
  }
}
