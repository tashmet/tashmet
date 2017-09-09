import {provider, inject} from '@ziggurat/tiamat';
import {classToPlain, plainToClass} from 'class-transformer';
import {Transformer, ModelConfig} from './interfaces';
import {Document} from '../models/document';
import {each} from 'lodash';
import * as Promise from 'bluebird';

@provider({
  for: 'isimud.Transformer',
  singleton: true
})
export class TransformerService implements Transformer {
  private models: {[name: string]: any} = {};

  constructor(
    @inject('isimud.Models') models: any[]
  ) {
    models.forEach(m => {
      let config: ModelConfig = Reflect.getOwnMetadata('isimud:model', m);
      this.models[config.name] = m;
    });
  }

  public toInstance<T extends Document>(
    plain: any, mode: string, defaultModel = 'isimud.Document'): Promise<T>
  {
    let model = plain._model;

    return new Promise<T>((resolve, reject) => {
      if (!plain._model || plain._model.length === 0) {
        model = defaultModel;
      }

      if (!this.models[model]) {
        return reject(new Error(`No such model: ${model}`));
      }

      let instance = plainToClass(this.models[model], plain, {
        strategy: 'excludeAll',
        groups: [mode]
      });
      if (Array.isArray(instance)) {
        reject(new Error());
      } else {
        let defaults: any = new this.models[model]();

        each(defaults, (value, key) => {
          if ((<any>instance)[key] === undefined) {
            (<any>instance)[key] = value;
          }
        });
        resolve(instance);
      }
    });
  }

  public toPlain<T extends Document>(instance: T, mode: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let obj = <any>classToPlain(instance, {strategy: 'excludeAll', groups: [mode]});
      obj._model = instance._model;
      resolve(obj);
    });
  }
}
