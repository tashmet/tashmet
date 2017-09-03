import {provider, inject} from '@ziggurat/tiamat';
import {transformAndValidate} from 'class-transformer-validator';
import {validate} from 'class-validator';
import {classToPlain} from 'class-transformer';
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

  public validate<T>(instance: T): Promise<any> {
    return new Promise<any>(resolve => {
      validate(instance).then(errors => {
        resolve(errors);
      });
    });
  }

  public toInstance<T>(plain: any, mode: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.models[plain._model]) {
        return reject(new Error(`No such model: ${plain._model}`));
      }

      transformAndValidate(this.models[plain._model], plain, {
        transformer: {
          strategy: 'excludeAll',
          groups: [mode]}
        })
        .then((obj: T) => {
          resolve(obj);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  public toPlain<T>(instance: T, mode: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      resolve(classToPlain(instance, {strategy: 'excludeAll', groups: [mode]}));
    });
  }
}
