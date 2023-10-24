import { Document, TashmetNamespace } from '@tashmet/tashmet';
import { WriteCommand } from '../commands/write.js';
import { CursorRegistry } from '../cursor.js';
import { command, EventEmitter } from '../interfaces.js';
import { Store } from '../store.js';


export abstract class AbstractReadController {
  public constructor(
    protected cursors: CursorRegistry,
  ) {}

  @command('getMore')
  public async getMore(ns: TashmetNamespace, {getMore, collection, batchSize}: Document) {
    const c = this.cursors.getCursor(getMore);
    if (!c) throw new Error('Invalid cursor');

    return {
      cursor: {
        nextBatch: await c.getBatch(batchSize) ,
        id: c.id,
        ns: {db: ns.db, coll: collection},
      },
      ok: 1,
    }
  }
}

export abstract class AbstractWriteController extends EventEmitter {
  public constructor(
    protected store: Store
  ) { super(); }

  protected async write(command: WriteCommand, ordered: boolean) {
    const changes = await command.execute();

    const writeErrors = await this.store.write(changes, {ordered});
    const successfulChanges = changes.filter((c, i) => !writeErrors.find(
      err => ordered ? i >= err.index : i === err.index)
    );

    let res: Document = { ok: 1, n: successfulChanges.length};

    if (writeErrors.length > 0) {
      res.writeErrors = writeErrors;
    }

    if (command.op === 'update') {
      res = {
        ...res,
        nModified: successfulChanges.filter(c => c.operationType !== 'insert').length,
        upserted: successfulChanges
          .filter(c => c.operationType === 'insert')
          .map((c, index) => ({index, _id: (c.documentKey as any)._id})),
      }
    }
  
    for (const c of successfulChanges) {
      this.store.emit('change', c);
    }

    return res;
  }
}
