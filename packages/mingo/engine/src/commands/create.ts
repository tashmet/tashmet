import { Document } from '../interfaces';
import { MingoCommandHandler } from '../command';

export class CreateCommandHandler extends MingoCommandHandler {
  public async execute({create: coll, viewOn, pipeline}: Document) {
    await this.store.create(coll);

    if (typeof viewOn === 'string') {
      // TODO: Implement view creation
    }

    return {ok: 1};
  }
}
