import { Document, TashmetNamespace } from '@tashmet/tashmet';
import { command } from '../command.js';
import { CollectionFactory, ViewMap } from '../interfaces.js';
import { Store } from '../store.js';

export class AdminController {
  public constructor(
    protected store: Store,
    protected collectionFactory: CollectionFactory,
    protected views: ViewMap | undefined,
  ) {}

  @command('create')
  public async create(ns: TashmetNamespace, {create: name, viewOn, pipeline, ...options}: Document) {
    const fullNs = ns.withCollection(name);

    if (viewOn) {
      if (this.views) {
        this.views[fullNs.toString()] = {viewOn, pipeline};
      } else {
        throw new Error('views are not supported by the storage engine');
      }
    } else {
      const coll = this.collectionFactory.createCollection(fullNs, options);
      this.store.addCollection(coll);
    }

    return {ok: 1};
  }

  @command('drop')
  public async drop(ns: TashmetNamespace, {drop: name}: Document) {
    if (this.views && this.views[name]) {
      delete this.views[name];
    } else {
      this.store.dropCollection(ns.withCollection(name));
    }
    this.store.emit('change', { operationType: 'drop', ns: { db: ns.db, coll: name } });
    return {ok: 1};
  }
}
