import {PropertyMeta, PropertyDecorator,
  TaggedClassAnnotation} from '@ziggurat/tiamat';
import {CollectionConfig} from './decorators';
import {uniq} from 'lodash';

export class ControllerDecorator extends TaggedClassAnnotation<CollectionConfig> {
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

