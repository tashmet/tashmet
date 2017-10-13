import {Injector, PropertyMeta} from '@ziggurat/tiamat';
import {ModelConfig, ModelRegistry} from '@ziggurat/mushdamma';
import {Pipe} from '@ziggurat/ningal';
import {Collection} from '../interfaces';
import {each} from 'lodash';

export class ReferenceValidationPipe implements Pipe {
  public constructor(
    private injector: Injector,
    private models: ModelRegistry
  ) {}

  public async process(input: any): Promise<any> {
    const model = this.models.get(input._model);

    const references: PropertyMeta<string>[] = Reflect.getMetadata(
      'isimud:reference', model) || [];

    for (let ref of references) {
      try {
        await this.injector.get<Collection>(ref.data).findOne({_id: input[ref.key]});
      } catch (err) {
        throw new Error(`Reference to '${input[ref.key]}' not found in ${ref.data}`);
      }
    }
    return Promise.resolve(input);
  }
}
