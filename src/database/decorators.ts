import {classDecorator, TaggedClassAnnotation, PropertyMeta} from '@ziggurat/tiamat';
import {CollectionConfig} from './interfaces';
import {uniq} from 'lodash';

class CollectionDecorator extends TaggedClassAnnotation<CollectionConfig> {
  public decorate(data: CollectionConfig, target: any) {
    let parentMeta = Reflect.getMetadata('isimud:collection', target);
    if (parentMeta) {
      if (parentMeta.populateAfter) {
        data.populateAfter = uniq(
          (data.populateAfter || []).concat(parentMeta.populateAfter));
      }
    }
    super.decorate(data, target);
  }
}

export const collection = classDecorator<CollectionConfig>(
  new CollectionDecorator('isimud:collection', ['isimud.Collection']), {
    model: 'isimud.Document',
    middleware: [],
    populate: false,
    populateAfter: []
  });
