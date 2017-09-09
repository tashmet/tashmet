import {classDecorator} from '@ziggurat/tiamat';
import {ModelConfig} from './interfaces';
import {ModelDecorator} from './model';
import {Type} from 'class-transformer';

export const model = classDecorator<ModelConfig>(
  new ModelDecorator('isimud:model'), {
    exclude: {}
  });

export const type = Type;
