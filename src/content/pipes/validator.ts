import {Pipe} from '../interfaces';
import * as jsonschema from 'jsonschema';
import {DocumentError} from '../index';

let JsonValidator = jsonschema.Validator;

/**
 * Pipe that validates a document according to a schema.
 */
export class Validator implements Pipe {
  private jsonValidator = new JsonValidator();

  public constructor(private schema: any) {}

  public process(input: any, next: (output: any) => void): void {
    if (this.schema) {
      let result = this.jsonValidator.validate(input, this.schema);
      if (result.errors.length > 0) {
        return next(new DocumentError(
          result.errors[0].instance, result.errors[0].message));
      }
    }
    next(input);
  }
}
