import {classDecorator} from '@ziggurat/tiamat';
import {ModelConfig} from './interfaces';
import {ModelDecorator} from './model';

export const model = classDecorator<ModelConfig>(
  new ModelDecorator('isimud:model'), {
    exclude: {}
  });
