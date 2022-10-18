import { Document, command, ViewMap, CollectionRegistry } from '../interfaces';

export class AdminController {
  public constructor(
    protected collections: CollectionRegistry,
    protected views: ViewMap | undefined,
  ) {}

  @command('create')
  public async create({create: name, viewOn, pipeline, ...options}: Document) {
    if (viewOn) {
      if (this.views) {
        this.views[name] = {viewOn, pipeline};
      } else {
        throw new Error('views are not supported by the storage engine');
      }
    } else {
      await this.collections.create(name, options);
    }

    return {ok: 1};
  }

  @command('drop')
  public async drop({drop: name}: Document) {
    if (this.views && this.views[name]) {
      delete this.views[name];
    } else {
      await this.collections.drop(name);
    }
    return {ok: 1};
  }
}
