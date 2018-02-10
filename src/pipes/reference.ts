import {Injector, PropertyMeta} from '@ziggurat/tiamat';
import {ModelConfig, ModelRegistry} from '@ziggurat/mushdamma';
import {Pipe} from '@ziggurat/ningal';
import {Collection} from '../interfaces';
import {Document} from '../models/document';
import {each} from 'lodash';

export class ReferenceValidationPipe implements Pipe<Document> {
  public constructor(
    private injector: Injector,
    private models: ModelRegistry
  ) {}

  public async process(input: Document): Promise<Document> {
    const model = this.models.get(input._model);

    if (!model) {
      throw new Error(`Failed to find model '${input._model}' in registry`);
    }

    const references: PropertyMeta<string>[] = Reflect.getMetadata(
      'isimud:reference', model) || [];

    for (let ref of references) {
      try {
        await this.injector.get<Collection>(ref.data).findOne({
          _id: (<any>input)[ref.key]
        });
      } catch (err) {
        throw new Error(`Reference to '${(<any>input)[ref.key]}' not found in ${ref.data}`);
      }
    }
    return Promise.resolve(input);
  }
}
