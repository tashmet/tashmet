import {injectable, decorate} from '@samizdatjs/tiamat';
import {Pipeline, Hook, HookablePipe} from './pipes';
import {EventEmitter} from 'events';

decorate(injectable(), EventEmitter);

@injectable()
export class Controller extends EventEmitter {
  protected addHooks(pipes: {[key: string]: Pipeline}): void {
    const hooks = Reflect.getMetadata(
      'tashmetu:collection-hook', this.constructor) || [];

    hooks.forEach((hook: any) => {
      const pipe = new Hook(this, hook.key);
      let steps = this.getMatchingSteps(hook.config, pipes);

      steps.forEach((step: HookablePipe) => {
        switch (hook.type) {
          case 'before': step.before(pipe); break;
          case 'after':  step.after(pipe);  break;
          case 'error':  step.error(pipe);  break;
        }
      });
    });
  }

  private getMatchingSteps(hook: any, pipes: {[name: string]: Pipeline}): HookablePipe[] {
    let steps: HookablePipe[] = [];
    if (hook.pipe) {
      if (hook.pipe in pipes) {
        let step = <HookablePipe>pipes[hook.pipe].getStep(hook.step);
        if (step) {
          steps.push(step);
        }
      }
    } else {
      for (let name in pipes) {
        if (pipes[name]) {
          let step = <HookablePipe>pipes[name].getStep(hook.step);
          if (step) {
            steps.push(step);
          }
        }
      }
    }
    return steps;
  }
}
