import { AggregationEngine, makeQueryPipeline } from '../aggregation.js';
import { AggregationDeleteCommand } from '../commands/delete.js';
import { InsertCommand } from '../commands/insert.js';
import { AggregationUpdateCommand } from '../commands/update.js';
import { command, Document, ViewMap, Writable } from '../interfaces.js';
import { AbstractReadController, AbstractWriteController } from './common.js';


export class AggregationReadController extends AbstractReadController {
  public constructor(
    db: string,
    protected aggregation: AggregationEngine,
    protected views: ViewMap,
  ) { super(db, aggregation); }

  @command('getMore')
  public async getMore(cmd: Document) {
    return super.getMore(cmd);
  }

  @command('aggregate')
  public async aggregate({aggregate, pipeline, collation, cursor}: Document): Promise<Document> {
    const view = this.views[aggregate];
    if (view) {
      return this.aggregate({
        aggregate: view.viewOn,
        pipeline: [...view.pipeline, ...pipeline],
        collation,
        cursor,
      });
    }

    const c = this.aggregation.aggregate(this.db, aggregate, pipeline, collation);

    return {
      cursor: {
        firstBatch: await c.getBatch(cursor?.batchSize) ,
        id: c.id,
        ns: {db: this.db, coll: aggregate},
      },
      ok: 1,
    }
  }

  @command('find')
  public find({find, filter, sort, skip, limit, projection, collation, batchSize}: Document) {
    return this.aggregate({
      aggregate: find,
      pipeline: makeQueryPipeline({filter, sort, skip, limit, projection}),
      collation,
      cursor: {batchSize},
    });
  }

  @command('count')
  public async count({count, query: filter, sort, skip, limit, collation}: Document) {
    const {cursor} = await this.aggregate({
      aggregate: count,
      pipeline: [...makeQueryPipeline({filter, sort, skip, limit}), {$count: 'count'}],
      collation,
    });
    const n = cursor.firstBatch[0].count;
    this.cursors.closeCursor(cursor.id);

    return {n, ok: 1};
  }

  @command('distinct')
  public async distinct({distinct, key, query, collation}: Document) {
    const {cursor} = await this.aggregate({
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
  public constructor(
    protected db: string,
    writable: Writable,
    protected aggregation: AggregationEngine,
  ) { super(writable); }

  @command('insert')
  public async insert({insert: coll, documents, ordered}: Document) {
    return this.write(new InsertCommand(documents, {db: this.db, coll}), ordered);
  }

  @command('update')
  public async update({update: coll, updates, ordered}: Document) {
    return this.write(new AggregationUpdateCommand(updates, {db: this.db, coll}, this.aggregation), ordered);
  }

  @command('delete')
  public async delete({delete: coll, deletes, ordered}: Document) {
    return this.write(new AggregationDeleteCommand(deletes, {db: this.db, coll}, this.aggregation), ordered);
  }
}
