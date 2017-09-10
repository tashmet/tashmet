import {ClassAnnotation} from '@ziggurat/tiamat';
import {Expose} from 'class-transformer';
import {ModelConfig} from './interfaces';
import {pull} from 'lodash';

export class ModelDecorator extends ClassAnnotation<ModelConfig> {
  public decorate(data: ModelConfig, target: any) {
    super.decorate(data, target);

    let decorators: any[] = [];

    const properties = Reflect.getMetadata('isimud:modelProperty', target) || [];
    properties.forEach((key: string) => {
      let exposeGroups = ['persist', 'relay'];
      if (data.exclude && data.exclude.hasOwnProperty(key)) {
        switch (data.exclude[key]) {
          case 'persist':
            pull(exposeGroups, 'persist');
            break;
          case 'relay':
            pull(exposeGroups, 'relay');
            break;
          case 'always':
            exposeGroups = [];
        }
      }
      Reflect.decorate(<any>[Expose({groups: exposeGroups})], target, key);
    });
    Reflect.defineMetadata(this.name, data, target);
  }
}
