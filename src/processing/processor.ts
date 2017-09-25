import {provider} from '@ziggurat/tiamat';
import {Collection, DocumentError} from '../interfaces';
import {Document} from '../models/document';
import {HookablePipeline, MethodPipe, HookablePipe} from './pipes';
import {Transformer, Validator} from '../schema/interfaces';
import {Pipe, Processor, Routine, HookMeta, HookConfig} from './interfaces';
import {EventEmitter} from 'eventemitter3';
import {each, isString} from 'lodash';
import * as Promise from 'bluebird';

@provider({
  for: 'isimud.ProcessorFactory',
  singleton: true
})
export class ProcessorFactory {
  public createProcessor(): Processor {
    return new ProcessorService();
  }
}

export class ProcessorService extends EventEmitter implements Processor {
  private pipes: {[name: string]: HookablePipeline} = {};
  private externals: {[name: string]: HookablePipeline[]} = {};

  public pipe(name: string, external: boolean | string, steps: {[name: string]: Pipe}): Processor {
    let pipeline = new HookablePipeline(true);

    each(steps, (pipe: Pipe, stepName: string) => {
      pipeline.step(stepName, pipe);
    });

    this.pipes[name] = pipeline;
    pipeline.on('document-error', (err: DocumentError) => {
      this.emit('document-error', err);
    });
    if (external) {
      if (isString(external)) {
        name = external;
      }
      if (name in this.externals) {
        this.externals[name].push(pipeline);
      } else {
        this.externals[name] = [pipeline];
      }
    }
    return this;
  }

  public routine(routine: Routine): Processor {
    each(routine.hooks, hook => {
      this.hook(new MethodPipe(routine, hook.key), hook);
    });
    return this;
  }

  public hook(pipe: Pipe, hook: HookMeta): Processor {
    let steps = this.getMatchingSteps(hook.data);

    steps.forEach((step: HookablePipe) => {
      switch (hook.type) {
        case 'before': step.before(pipe); break;
        case 'after':  step.after(pipe);  break;
        case 'error':  step.error(pipe);  break;
      }
    });
    return this;
  }

  public process(doc: any, pipe: string): Promise<any> {
    return this.pipes[pipe].process(doc);
  }

  private getMatchingSteps(hook: HookConfig): HookablePipe[] {
    let steps: HookablePipe[] = [];
    if (hook.pipe) {
      if (hook.pipe in this.externals) {
        this.externals[hook.pipe].forEach((pipeline: HookablePipeline) => {
          let step = <HookablePipe>pipeline.getStep(hook.step);
          if (step) {
            steps.push(step);
          }
        });
      }
    } else {
      each(this.externals, (pipelines: HookablePipeline[]) => {
        each(pipelines, (pipeline: HookablePipeline) => {
          let step = <HookablePipe>pipeline.getStep(hook.step);
          if (step) {
            steps.push(step);
          }
        });
      });
    }
    return steps;
  }
}
