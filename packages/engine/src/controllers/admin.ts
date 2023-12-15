import { Document, TashmetNamespace } from '@tashmet/tashmet';
import { command, CommandRunner } from '../command.js';
import { CollectionFactory, ViewMap } from '../interfaces.js';
import { Store } from '../store.js';

export class AdminController {
  constructor(
    protected store: Store,
    protected collectionFactory: CollectionFactory,
    protected views: ViewMap | undefined,
  ) {}

  @command('create')
  async create(ns: TashmetNamespace, {create: name, ...options}: Document, cmdRunner: CommandRunner) {
    const fullNs = ns.withCollection(name);
    const systemNs = ns.withCollection('system.collections');

    if (options.viewOn) {
      if (this.views) {
        this.views[fullNs.toString()] = {viewOn: options.viewOn, pipeline: options.pipeline};
      } else {
        throw new Error('views are not supported by the storage engine');
      }
    } else {
      const coll = this.collectionFactory.createCollection(fullNs, options);
      this.store.addCollection(coll);
    }

    await cmdRunner.command(systemNs, {
      update: systemNs.collection,
      updates: [
        {
          q: { _id: name },
          u: { _id: name, ...options },
          upsert: true,
          multi: false,
        }
      ],
      ordered: true,
    });

    return { ok: 1 };
  }

  @command('drop')
  async drop(ns: TashmetNamespace, {drop: name}: Document) {
    if (this.views && this.views[name]) {
      delete this.views[name];
    } else {
      this.store.dropCollection(ns.withCollection(name));
    }
    this.store.emit('change', { operationType: 'drop', ns: { db: ns.db, coll: name } });
    return { ok: 1 };
  }
}
