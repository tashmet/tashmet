import {Pipe} from '../interfaces';

let defaults = require('json-schema-defaults');

/**
 * Pipe that merges default values from schema.
 */
export class MergeDefaults implements Pipe {
  public constructor(private schemas: any) {}

  public process(input: any, next: (output: any) => void): void {
    let output = input;
    for (let schema of this.schemas) {
      output = Object.assign({}, defaults(schema), input);
    }
    next(output);
  }
}

/**
 * Pipe that strips default values in schema from object.
 * TODO: Deep strip
 */
export class StripDefaults implements Pipe {
  public constructor(private schemas: any) {}

  public process(input: any, next: (output: any) => void): void {
    let output = input;
    for (let schema of this.schemas) {
      let defs = defaults(schema);
      for (let key in defs) {
        if (input[key] === defs[key]) {
          delete output[key];
        }
      }
    }
    next(output);
  }
}
