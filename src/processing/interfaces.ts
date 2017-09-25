import {PropertyMeta} from '@ziggurat/tiamat';
import {DocumentError} from '../interfaces';
import * as Promise from 'bluebird';

/**
 * A pipe processes a single document and provides the result through a callback.
 * Multiple pipes can be chained together to form a pipeline.
 */
export interface Pipe {
  /**
   * Processes the input and passes the result to the 'next'-callback.
   * If an error occurs, it can be passed to the callback instead.
   */
  process(input: any): Promise<any>;
}

/**
 * Input for hook decorators (before, after and error).
 */
export interface HookConfig {
  /**
   * The name of the step that the hook applies to.
   */
  step: string;

  /**
   * The name of the pipe that the hook applies to.
   */
  pipe?: string;
}

export interface HookMeta extends PropertyMeta<HookConfig> {
  type: string;
}

export abstract class Routine {
  public get hooks(): HookMeta[] {
    return  Reflect.getMetadata('isimud:hook', this.constructor) || [];
  }
}

/**
 * A processor is a collection of pipelines that can be extended with hooks.
 */
export interface Processor {
  /**
   * Add a new pipeline.
   *
   * The pipeline is identified with a name that later refers to it when process() is called.
   * It can also, optionally, have an 'external' name that hooks use to refer to it. This allows
   * two or more separate pipelines to appear as the same one externally but with the ability
   * for them to be processed individually.
   *
   * When external is set to a boolean value it determines if the pipeline is visible externally
   * at all, true meaning it will be visible with its given name.
   *
   * The steps are a dictionary of named pipes.
   */
  pipe(name: string, external: boolean | string, steps: {[name: string]: Pipe}): Processor;

  /**
   * Add a hook.
   *
   * The hook consists of a pipe and meta data that determines where it will be attached.
   */
  hook(pipe: Pipe, hook: HookMeta): Processor;

  /**
   * Add a routine.
   *
   * This function takes a routine and adds all its hooks.
   */
  routine(routine: Routine): Processor;

  /**
   * Process an object through a given pipeline.
   */
  process(obj: any, pipe: string): Promise<any>;

  /**
   * Listen to document error events.
   */
  on(event: 'document-error', fn: (err: DocumentError) => void): Processor;
}

export interface ProcessorFactory {
  createProcessor(): Processor;
}
