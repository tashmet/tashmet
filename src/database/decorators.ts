import {classDecorator} from '@ziggurat/meta';
import {CollectionConfig} from './interfaces';

export class CollectionAnnotation {
  public constructor(
    public config: CollectionConfig
  ) {}
}

export const collection = <(config: CollectionConfig) => any>
  classDecorator(CollectionAnnotation, {
    middleware: [],
  });
