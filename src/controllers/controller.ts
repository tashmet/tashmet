import {injectable, decorate} from '@samizdatjs/tiamat';
import {HookMeta, HookConfig} from './meta/decorators';
import {Routine} from './routine';
import {Pipeline, Hook, HookablePipe, HookablePipeline} from '../pipes';
import {EventEmitter} from '../util';

@injectable()
export class Controller extends EventEmitter {
  protected pipes: {[name: string]: HookablePipeline} = {};

  public addRoutine(routine: Routine<any>): void {
    this.addHooks(routine);
  }

  protected addHooks(host: any): void {
    const hooks: HookMeta[] = Reflect.getMetadata(
      'tashmetu:hook', host.constructor) || [];

    hooks.forEach((hook: HookMeta) => {
      const pipe = new Hook(host, hook.key);
      let steps = this.getMatchingSteps(hook.data);

      steps.forEach((step: HookablePipe) => {
        switch (hook.type) {
          case 'before': step.before(pipe); break;
          case 'after':  step.after(pipe);  break;
          case 'error':  step.error(pipe);  break;
        }
      });
    });
  }

  private getMatchingSteps(hook: HookConfig): HookablePipe[] {
    let steps: HookablePipe[] = [];
    if (hook.pipe) {
      if (hook.pipe in this.pipes) {
        let step = <HookablePipe>this.pipes[hook.pipe].getStep(hook.step);
        if (step) {
          steps.push(step);
        }
      }
    } else {
      for (let name in this.pipes) {
        if (this.pipes[name]) {
          let step = <HookablePipe>this.pipes[name].getStep(hook.step);
          if (step) {
            steps.push(step);
          }
        }
      }
    }
    return steps;
  }
}
