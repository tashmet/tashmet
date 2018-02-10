import {PropertyMeta} from '@ziggurat/tiamat';
import {Validator, ModelConfig} from '@ziggurat/mushdamma';
import {Pipe} from '@ziggurat/ningal';
import {DocumentError} from '../interfaces';
import {Document} from '../models/document';

/**
 * Pipe that validates the input document against its model's constraints.
 */
export class ValidationPipe implements Pipe<Document> {
  public constructor(
    private validator: Validator
  ) {}

  public async process(input: Document): Promise<Document> {
    let result = await this.validator.validate(input);
    if (result.length > 0) {
      const c = result[0].constraints;
      throw new DocumentError(input, c[Object.keys(c)[0]]);
    } else {
      return input;
    }
  }
}
