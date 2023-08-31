import { command, Document, EventEmitter, ViewMap, CollectionRegistry } from '../interfaces.js';

export class AdminController extends EventEmitter {
  public constructor(
    protected db: string,
    protected collections: CollectionRegistry,
    protected views: ViewMap | undefined,
  ) { super(); }

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
    this.emit('change', { operationType: 'drop', ns: { db: this.db, coll: name } });
    return {ok: 1};
  }
}
