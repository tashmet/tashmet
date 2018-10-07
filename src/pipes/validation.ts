import {Validator} from '@ziggurat/amelatu';
import {Pipe} from '@ziggurat/ningal';
import {DocumentValidationError} from '../interfaces';
import {Document} from '../models/document';

/**
 * Pipe that validates the input document against its model's constraints.
 */
export class ValidationPipe implements Pipe<Document> {
  public constructor(
    private validator: Validator
  ) {}

  public async process(input: Document): Promise<Document> {
    let result = this.validator.validate(input);
    if (!result.hasPassed()) {
      throw new DocumentValidationError(result);
    } else {
      return input;
    }
  }
}
