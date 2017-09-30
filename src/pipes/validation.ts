import {PropertyMeta} from '@ziggurat/tiamat';
import {Validator, ModelConfig} from '@ziggurat/mushdamma';
import {Pipe} from '@ziggurat/ningal';
import {DocumentError} from '../interfaces';
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
          const c = result[0].constraints;
          reject(new DocumentError(input, c[Object.keys(c)[0]]));
        } else {
          resolve(input);
        }
      });
    });
  }
}
