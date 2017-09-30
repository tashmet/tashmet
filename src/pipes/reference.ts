import {Injector, PropertyMeta} from '@ziggurat/tiamat';
import {ModelConfig} from '@ziggurat/mushdamma';
import {Pipe} from '@ziggurat/ningal';
import {Collection} from '../interfaces';
import {each} from 'lodash';
import * as Promise from 'bluebird';

export class ReferenceValidationPipe implements Pipe {
  private models: {[name: string]: any} = {};

  public constructor(
    private injector: Injector
  ) {
    each(injector.get('mushdamma.Models'), m => {
      let config: ModelConfig = Reflect.getOwnMetadata('mushdamma:model', m);
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
