import {injectable} from '@ziggurat/tiamat';
import {Collection, DocumentError, Pipe, QueryOptions, CacheEvaluator} from '../interfaces';
import {Document} from '../models/document';
import {HookablePipeline, Hook, HookablePipe} from '../pipes';
import {Transformer, Validator} from '../schema/interfaces';
import {HookMeta, HookConfig} from './meta/decorators';
import {Routine} from './routine';
import {EventEmitter} from 'eventemitter3';
import {each, isString} from 'lodash';
import * as Promise from 'bluebird';

export class Processor extends EventEmitter {
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

  public process(doc: any, pipe: string): Promise<any> {
    return this.pipes[pipe].process(doc);
  }

  public addHooks(host: any): void {
    const hooks: HookMeta[] = Reflect.getMetadata(
      'isimud:hook', host.constructor) || [];

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
