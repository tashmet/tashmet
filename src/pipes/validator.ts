import {Pipe} from '../interfaces';
import {DocumentError} from '../index';
import * as jsonschema from 'jsonschema';
import * as Promise from 'bluebird';

let JsonValidator = jsonschema.Validator;

/**
 * Pipe that validates a document according to a schema.
 */
export class Validator implements Pipe {
  private jsonValidator = new JsonValidator();

  public constructor(private schemas: any[]) {}

  public process(input: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      for (let schema of this.schemas) {
        let result = this.jsonValidator.validate(input, schema);
        if (result.errors.length > 0) {
          return reject(new DocumentError(
            input, result.errors[0].property + ' ' + result.errors[0].message));
        }
      }
      resolve(input);
    });
  }
}
