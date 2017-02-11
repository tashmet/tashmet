import {Pipe} from '../interfaces';
import {Pipeline} from './pipeline';

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
      .step(this.hooksBefore)
      .step(pipe)
      .step(this.hooksAfter);
  };

  public before(hook: Pipe): void {
    this.hooksBefore.step(hook);
  }

  public after(hook: Pipe): void {
    this.hooksAfter.step(hook);
  }

  public error(hook: Pipe): void {
    this.hooksError.step(hook);
  }

  public process(input: any, next: (output: any) => void): void {
    this.pipeline.process(input, (result: any) => {
      if (result instanceof Error) {
        this.hooksError.process(result, next);
      } else {
        next(result);
      }
    });
  }
}

/**
 * Pipe that passes data through a hook defined as a method on a given controller.
 */
export class Hook implements Pipe {
  public constructor(private controller: any, private method: string) {}

  public process(input: any, next: (output: any) => void): void {
    this.controller[this.method].call(this.controller, input, next);
  }
}
