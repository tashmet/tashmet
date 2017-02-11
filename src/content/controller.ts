import {injectable, decorate} from '@samizdatjs/tiamat';
import {Hook, HookablePipe} from './pipes';
import {EventEmitter} from 'events';

decorate(injectable(), EventEmitter);

@injectable()
export class Controller extends EventEmitter {
  public constructor() {
    super();
  }

  protected addHooks(steps: {[key: string]: HookablePipe}): void {
    const hooks = Reflect.getOwnMetadata(
      'tashmetu:collection-hook', this.constructor) || [];

    hooks.forEach((hook: any) => {
      const pipe = new Hook(this, hook.key);

      switch (hook.type) {
        case 'before':
          steps[hook.step].before(pipe);
          break;
        case 'after':
          steps[hook.step].after(pipe);
          break;
        case 'error':
          steps[hook.step].error(pipe);
          break;
      }
    });
  }
}
