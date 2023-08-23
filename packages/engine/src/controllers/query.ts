import { QueryDeleteCommand } from '../commands/delete.js';
import { InsertCommand } from '../commands/insert.js';
import { QueryUpdateCommand } from '../commands/update.js';
import { command, Document, Writable } from '../interfaces.js';
import { QueryEngine } from '../query.js';
import { AbstractReadWriteController } from './common.js';


export class QueryController extends AbstractReadWriteController {
  public constructor(
    db: string,
    writable: Writable,
    private engine: QueryEngine,
  ) { super(db, engine, writable); }

  @command('getMore')
  public async getMore(cmd: Document) {
    return super.getMore(cmd);
  }

  @command('find')
  public async find({find, filter, sort, skip, limit, projection, batchSize, collation}: Document) {
    const c = this.engine.find(find, {filter, sort, skip, limit, projection}, collation);
    return {
      cursor: {
        firstBatch: await c.getBatch(batchSize) ,
        id: c.id,
        ns: {db: this.db, coll: find},
      },
      ok: 1,
    }
  }

  @command('count')
  public async count({count, query: filter, sort, skip, limit, collation}: Document) {
    const c = this.engine.find(count, {filter, sort, skip, limit, projection: {_id: 1}}, collation);
    const n = (await c.toArray()).length;
    this.engine.closeCursor(c.id);

    return {n, ok: 1};
  }

  @command('insert')
  public async insert({insert: coll, documents, ordered}: Document) {
    return this.write(new InsertCommand(documents, {db: this.db, coll}), ordered);
  }

  @command('update')
  public async update({update: coll, updates, ordered}: Document) {
    return this.write(new QueryUpdateCommand(updates, {db: this.db, coll}, this.engine), ordered);
  }

  @command('delete')
  public async delete({delete: coll, deletes, ordered}: Document) {
    return this.write(new QueryDeleteCommand(deletes, {db: this.db, coll}, this.engine), ordered);
  }
}
