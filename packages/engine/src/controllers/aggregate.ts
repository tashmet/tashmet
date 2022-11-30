import { AggregationEngine, makeQueryPipeline } from '../aggregation';
import { AggregationDeleteCommand } from '../commands/delete';
import { InsertCommand } from '../commands/insert';
import { AggregationUpdateCommand } from '../commands/update';
import { command, Document, ViewMap, Writable } from '../interfaces';
import { AbstractReadWriteController } from './common';

/**
 * A database reader engine with support for aggregation and views
 */
export class AggregationController extends AbstractReadWriteController {
  public constructor(
    db: string,
    writable: Writable,
    protected aggregation: AggregationEngine,
    protected views: ViewMap,
  ) { super(db, aggregation, writable); }

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

    const c = this.aggregation.aggregate(aggregate, pipeline, collation);

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
