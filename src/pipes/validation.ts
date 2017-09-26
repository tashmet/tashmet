import {Injector, PropertyMeta} from '@ziggurat/tiamat';
import {Pipe} from '@ziggurat/ningal';
import {DocumentError, Collection} from '../interfaces';
import {Validator, ModelConfig} from '../schema/interfaces';
import {each} from 'lodash';
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

export class ReferenceValidationPipe implements Pipe {
  private models: {[name: string]: any} = {};

  public constructor(
    private injector: Injector
  ) {
    each(injector.get('isimud.Models'), m => {
      let config: ModelConfig = Reflect.getOwnMetadata('isimud:model', m);
      this.models[config.name] = m;
    });
  }

  public process(input: any): Promise<any> {
    const model = this.models[input._model];

    const references: PropertyMeta<string>[] = Reflect.getMetadata(
      'isimud:reference', model) || [];

    return Promise.each(references, ref => {
      return this.injector.get<Collection>(ref.data).findOne({_id: input[ref.key]})
        .catch(err => {
          return Promise.reject(
             new Error(`Reference to '${input[ref.key]}' not found in ${ref.data}`));
        });
    })
      .then(() => {
        return Promise.resolve(input);
      });
  }
}
