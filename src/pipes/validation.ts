import {Pipe} from '../interfaces';
import {DocumentError} from '../index';
import {Validator} from '../validation/interfaces';
import * as Promise from 'bluebird';

/**
 * Pipe that validates the input document against its model's constraints.
 */
export class ValidationPipe implements Pipe {
  public constructor(
    private validator: Validator
  ) {}

  public process(input: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.validator.validate(input).then(result => {
        if (result.length > 0) {
          reject(new DocumentError(input, 'Validation failed'));
        } else {
          resolve(input);
        }
      });
    });
  }
}
