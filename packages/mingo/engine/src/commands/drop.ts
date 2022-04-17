import { Document } from '../interfaces';
import { MingoCommandHandler } from '../command';

export class DropCommandHandler extends MingoCommandHandler {
  public async execute({drop: coll}: Document) {
    await this.store.drop(coll);
    return {ok: 1};
  }
}
