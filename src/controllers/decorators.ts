import {classDecorator, TaggedClassAnnotation, PropertyMeta} from '@ziggurat/tiamat';
import {CollectionConfig, RoutineConfig} from './interfaces';
import {uniq} from 'lodash';

class ControllerDecorator extends TaggedClassAnnotation<CollectionConfig> {
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
  new ControllerDecorator('isimud:collection', ['isimud.Collection']), {
    model: 'isimud.Document',
    populateAfter: []
  });


export const routine = classDecorator<RoutineConfig>(
  new TaggedClassAnnotation('isimud:routine', ['isimud.Routine']));
