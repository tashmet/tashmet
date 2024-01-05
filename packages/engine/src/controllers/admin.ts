import { ChangeStreamDocument, Document, TashmetNamespace } from '@tashmet/tashmet';
import { command, CommandRunner } from '../command.js';
import { CollectionFactory, ViewMap } from '../interfaces.js';
import { Store } from '../store.js';
import ObjectID from 'bson-objectid';

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
  async drop(ns: TashmetNamespace, {drop: name}: Document, cmdRunner: CommandRunner) {
    const collectionNs = ns.withCollection(name);
    const systemNs = ns.withCollection('system.collections');
    const change: ChangeStreamDocument = { _id: ObjectID.toString(), operationType: 'drop', ns: { db: ns.db, coll: name } };

    if (this.views && this.views[name]) {
      delete this.views[name];
    } else {
      const col = this.store.getCollection(collectionNs);
      await cmdRunner.command(ns, {
        delete: name,
        deletes: [{ q: {} }],
      });
      await col.write([change], {});
      this.store.dropCollection(collectionNs);
    }

    await cmdRunner.command(systemNs, {
      delete: systemNs.collection,
      deletes: [
        {
          q: { _id: name },
          limit: 1,
        }
      ]
    });

    this.store.emit('change', change);

    return { ok: 1 };
  }
}
