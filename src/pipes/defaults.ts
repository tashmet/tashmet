import {Pipe} from '../interfaces';

let defaults = require('json-schema-defaults');

/**
 * Pipe that merges default values from schema.
 */
export class MergeDefaults implements Pipe {
  public constructor(private schema: any) {}

  public process(input: any, next: (output: any) => void): void {
    let output = input;
    if (this.schema) {
      output = Object.assign({}, defaults(this.schema), input);
    }
    next(output);
  }
}

/**
 * Pipe that strips default values in schema from object.
 * TODO: Deep strip
 */
export class StripDefaults implements Pipe {
  public constructor(private schema: any) {}

  public process(input: any, next: (output: any) => void): void {
    let output = input;
    if (this.schema) {
      let defs = defaults(this.schema);
      for (let key in defs) {
        if (input[key] === defs[key]) {
          delete output[key];
        }
      }
    }
    next(output);
  }
}
