import {propertyDecorator, PropertyMeta, PropertyMetaWriter} from '@samizdatjs/tiamat';

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
  pipe: string;
}

export interface HookMeta extends PropertyMeta<HookConfig> {
  type: string;
}

class HookMetaWriter extends PropertyMetaWriter<HookConfig> {
  public constructor(private type: string) {
    super();
  }

  public write(data: HookConfig, target: any, key: string) {
    let meta: HookMeta = {target, key, type: this.type, data};
    this.append('tashmetu:hook', meta, target.constructor);
  }
}

export const before = propertyDecorator<HookConfig>(new HookMetaWriter('before'));

export const after = propertyDecorator<HookConfig>(new HookMetaWriter('after'));

export const error = propertyDecorator<HookConfig>(new HookMetaWriter('error'));
