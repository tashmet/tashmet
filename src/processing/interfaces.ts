import {PropertyMeta} from '@ziggurat/tiamat';
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
