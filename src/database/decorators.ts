import {classDecorator} from '@ziggurat/meta';
import {CollectionConfig} from './interfaces';
import {uniq} from 'lodash';
import {Document} from '../models/document';

export class CollectionAnnotation {
  public constructor(
    public config: CollectionConfig
  ) {}
}

export const collection = <(config: CollectionConfig) => any>
  classDecorator(CollectionAnnotation, {
    middleware: [],
  });
