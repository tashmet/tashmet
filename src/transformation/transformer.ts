import {provider, inject} from '@ziggurat/tiamat';
import {classToPlain, plainToClass} from 'class-transformer';
import {Transformer} from './interfaces';
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

  public toInstance<T extends object>(plain: any, mode: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.models[plain._model]) {
        return reject(new Error(`No such model: ${plain._model}`));
      }

      const instance = plainToClass(this.models[plain._model], plain, {
        strategy: 'excludeAll',
        groups: [mode]
      });
      if (Array.isArray(instance)) {
        reject(new Error());
      } else {
        resolve(instance);
      }
    });
  }

  public toPlain<T extends object>(instance: T, mode: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      resolve(classToPlain(instance, {strategy: 'excludeAll', groups: [mode]}));
    });
  }
}
