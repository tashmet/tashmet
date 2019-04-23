import {Validator} from '@ziggurat/common';
import {Pipe} from '@ziggurat/ningal';
import {DocumentValidationError} from '../interfaces';

/**
 * Pipe that validates the input document against its model's constraints.
 */
export class ValidationPipe<T> implements Pipe<T> {
  public constructor(
    private validator?: Validator
  ) {}

  public async process(input: T): Promise<T> {
    if (!this.validator) {
      return input;
    }
    let result = this.validator.validate(input);
    if (!result.hasPassed()) {
      throw new DocumentValidationError(result);
    } else {
      return input;
    }
  }
}
