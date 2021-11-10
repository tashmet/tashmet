import {Container, Plugin, Provider} from '@tashmit/core';
import {AjvValidator} from './validator';
import {ValidationConfig} from './interfaces';
import {validation} from './pipe';

export * from './interfaces';
export {validation, ValidationPipeStrategy} from './pipe';

export default class Schema extends Plugin {
  public static validation = validation;

  public constructor(private config: ValidationConfig) {
    super();
  }

  public register(container: Container) {
    container.register(Provider.ofInstance(ValidationConfig, this.config));
    container.register(AjvValidator);
  }
}
