import {provider, inject} from '@ziggurat/tiamat';
import {classToPlain, plainToClass} from 'class-transformer';
import {Transformer} from './interfaces';
import {Document} from '../models/document';
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
      let name = Reflect.getOwnMetadata('isimud:model', m);
      this.models[name] = m;
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

      const instance = plainToClass(this.models[model], plain, {
        strategy: 'excludeAll',
        groups: [mode]
      });
      if (Array.isArray(instance)) {
        reject(new Error());
      } else {
        resolve(instance);
      }
    }).then((instance: T) => {
      instance._model = instance._model || model;
      return instance;
    });
  }

  public toPlain<T extends Document>(instance: T, mode: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      resolve(classToPlain(instance, {strategy: 'excludeAll', groups: [mode]}));
    });
  }
}
