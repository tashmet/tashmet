import {classDecorator, Annotation} from '@ziggurat/meta';
import {CollectionConfig} from './interfaces';

export class CollectionAnnotation extends Annotation {
  public constructor(
    public config: CollectionConfig
  ) { super(); }
}

export const collection = <(config: CollectionConfig) => any>
  classDecorator(CollectionAnnotation, {
    middleware: [],
    indices: ['_id']
  });
