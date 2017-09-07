import {provider, inject} from '@ziggurat/tiamat';
import {validate} from 'class-validator';
import {Validator} from './interfaces';
import * as Promise from 'bluebird';

@provider({
  for: 'isimud.Validator',
  singleton: true
})
export class ValidatorService implements Validator {
  public validate(instance: any): Promise<any> {
    return new Promise<any>(resolve => {
      validate(instance).then(errors => {
        resolve(errors);
      });
    });
  }
}
