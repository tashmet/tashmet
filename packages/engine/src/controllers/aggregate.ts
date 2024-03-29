import { Document, TashmetNamespace } from '@tashmet/tashmet';
import { AggregationEngine, makeQueryPipeline } from '../aggregation.js';
import { command } from '../command.js';
import { AggregationDeleteCommand } from '../commands/delete.js';
import { InsertCommand } from '../commands/insert.js';
import { AggregationUpdateCommand } from '../commands/update.js';
import { ViewMap } from '../interfaces.js';
import { Store } from '../store.js';
import { AbstractReadController, AbstractWriteController } from './common.js';


export class AggregationReadController extends AbstractReadController {
  constructor(
    protected aggregation: AggregationEngine,
    protected views: ViewMap,
  ) { super(aggregation); }

  @command('getMore')
  async getMore(ns: TashmetNamespace, cmd: Document) {
    return super.getMore(ns, cmd);
  }

  @command('aggregate')
  async aggregate(ns: TashmetNamespace, {aggregate, pipeline, collation, cursor}: Document): Promise<Document> {
    const view = this.views[ns.withCollection(aggregate).toString()];
    if (view) {
      return this.aggregate(ns, {
        aggregate: view.viewOn,
        pipeline: [...view.pipeline, ...pipeline],
        collation,
        cursor,
      });
    }

    const c = this.aggregation.aggregate(ns.db, aggregate, pipeline, collation);

    return {
      cursor: {
        firstBatch: await c.getBatch(cursor?.batchSize) ,
        id: c.id,
        ns: {db: ns.db, coll: aggregate},
      },
      ok: 1,
    }
  }

  @command('find')
  find(ns: TashmetNamespace, {find, filter, sort, skip, limit, projection, collation, batchSize}: Document) {
    return this.aggregate(ns, {
      aggregate: find,
      pipeline: makeQueryPipeline({filter, sort, skip, limit, projection}),
      collation,
      cursor: {batchSize},
    });
  }

  @command('count')
  async count(ns: TashmetNamespace, {count, query: filter, sort, skip, limit, collation}: Document) {
    const {cursor} = await this.aggregate(ns, {
      aggregate: count,
      pipeline: [...makeQueryPipeline({filter, sort, skip, limit}), {$count: 'count'}],
      collation,
    });
    const n = cursor.firstBatch[0].count;
    this.cursors.closeCursor(cursor.id);

    return {n, ok: 1};
  }

  @command('distinct')
  async distinct(ns: TashmetNamespace, {distinct, key, query, collation}: Document) {
    const {cursor} = await this.aggregate(ns, {
      aggregate: distinct,
      pipeline: [
        {$match: query || {}},
        {$unwind: `$${key}`},
        {$group: {_id: `$${key}`}},
      ],
      collation,
    });

    const values = cursor.firstBatch.map((doc: Document) => doc._id);
    this.cursors.closeCursor(cursor.id);

    return {values, ok: 1};
  }
}

/**
 * A database reader engine with support for aggregation and views
 */
export class AggregationWriteController extends AbstractWriteController {
  constructor(
    store: Store,
    protected aggregation: AggregationEngine,
  ) { super(store); }

  @command('insert')
  async insert(ns: TashmetNamespace, {insert: coll, documents, ordered, bypassDocumentValidation}: Document) {
    return this.write(new InsertCommand(documents, {db: ns.db, coll}), { ordered, bypassDocumentValidation });
  }

  @command('update')
  async update(ns: TashmetNamespace, {update: coll, updates, ordered}: Document) {
    return this.write(new AggregationUpdateCommand(updates, {db: ns.db, coll}, this.aggregation), { ordered });
  }

  @command('delete')
  async delete(ns: TashmetNamespace, {delete: coll, deletes, ordered}: Document) {
    return this.write(new AggregationDeleteCommand(deletes, {db: ns.db, coll}, this.aggregation), { ordered });
  }
}
