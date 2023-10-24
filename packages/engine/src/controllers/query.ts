import { Document, TashmetNamespace } from '@tashmet/tashmet';
import { QueryDeleteCommand } from '../commands/delete.js';
import { InsertCommand } from '../commands/insert.js';
import { QueryUpdateCommand } from '../commands/update.js';
import { command } from '../interfaces.js';
import { QueryEngine } from '../query.js';
import { Store } from '../store.js';
import { AbstractReadController, AbstractWriteController } from './common.js';

export class QueryReadController extends AbstractReadController {
  public constructor(
    private engine: QueryEngine, // TODO: Needs to have database
  ) { super(engine); }

  @command('getMore')
  public async getMore(ns: TashmetNamespace, cmd: Document) {
    return super.getMore(ns, cmd);
  }

  @command('find')
  public async find(ns: TashmetNamespace, {find, filter, sort, skip, limit, projection, batchSize, collation}: Document) {
    const c = this.engine.find(find, {filter, sort, skip, limit, projection}, collation);
    return {
      cursor: {
        firstBatch: await c.getBatch(batchSize) ,
        id: c.id,
        ns: {db: ns.db, coll: find},
      },
      ok: 1,
    }
  }

  @command('count')
  public async count(ns: TashmetNamespace, {count, query: filter, sort, skip, limit, collation}: Document) {
    const c = this.engine.find(count, {filter, sort, skip, limit, projection: {_id: 1}}, collation);
    const n = (await c.toArray()).length;
    this.engine.closeCursor(c.id);

    return {n, ok: 1};
  }
}

export class QueryWriteController extends AbstractWriteController {
  public constructor(
    store: Store,
    private engine: QueryEngine,
  ) { super(store); }

  @command('insert')
  public async insert(ns: TashmetNamespace, {insert: coll, documents, ordered}: Document) {
    return this.write(new InsertCommand(documents, {db: ns.db, coll}), ordered);
  }

  @command('update')
  public async update(ns: TashmetNamespace, {update: coll, updates, ordered}: Document) {
    return this.write(new QueryUpdateCommand(updates, {db: ns.db, coll}, this.engine), ordered);
  }

  @command('delete')
  public async delete(ns: TashmetNamespace, {delete: coll, deletes, ordered}: Document) {
    return this.write(new QueryDeleteCommand(deletes, {db: ns.db, coll}, this.engine), ordered);
  }
}
