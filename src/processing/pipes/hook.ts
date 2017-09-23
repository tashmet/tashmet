import {Pipe} from '../interfaces';
import {Pipeline} from './pipeline';
import * as Promise from 'bluebird';

/**
 * Pipe that supports adding hooks at the beginning, end and for when errors
 * occur. The hooks are themselves pipes and any number of them can be added.
 */
export class HookablePipe implements Pipe {
  private hooksBefore: Pipeline = new Pipeline();
  private hooksAfter: Pipeline = new Pipeline();
  private hooksError: Pipeline = new Pipeline();
  private pipeline: Pipeline = new Pipeline();

  public constructor(pipe: Pipe) {
    this.pipeline
      .step('before', this.hooksBefore)
      .step('pipe',   pipe)
      .step('after',  this.hooksAfter);
  }

  public before(hook: Pipe): void {
    this.hooksBefore.push(hook);
  }

  public after(hook: Pipe): void {
    this.hooksAfter.push(hook);
  }

  public error(hook: Pipe): void {
    this.hooksError.push(hook);
  }

  public process(input: any): Promise<any> {
    return this.pipeline.process(input)
      .catch((err: Error) => {
        if (this.hooksError.length > 0) {
          return this.hooksError.process(err);
        } else {
          return Promise.reject(err);
        }
      });
  }
}

export class HookablePipeline extends Pipeline {
  public step(name: string, pipe: Pipe): Pipeline {
    return super.step(name, new HookablePipe(pipe));
  }
}
