import {Pipe} from '../interfaces';
import {eachSeries} from 'async';
import {EventEmitter} from 'events';

/**
 * A series of pipes.
 */
export class Pipeline extends EventEmitter implements Pipe {
  private steps: any[] = [];

  public constructor(private emitErrors?: boolean) {
    super();
  }

  public step(step: Pipe): Pipeline {
    this.steps.push(step);
    return this;
  }

  public process(input: any, next: (output: any) => void): void {
    let result = input;

    eachSeries(this.steps, (step: any, done: any) => {
      step.process(result, (output: any) => {
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
      } else if (this.emitErrors) {
        this.emit('document-error', err);
      } else {
        next(err);
      }
    });
  }
}
