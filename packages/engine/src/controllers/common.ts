import { EventEmitter } from 'eventemitter3';
import { WriteCommand } from '../commands/write';
import { CursorRegistry } from '../cursor';
import { command, Document, Writable } from '../interfaces';


export abstract class AbstractReadWriteController extends EventEmitter {
  public constructor(
    protected db: string,
    protected cursors: CursorRegistry,
    protected writable: Writable
  ) { super(); }

  @command('getMore')
  public async getMore({getMore, collection, batchSize}: Document) {
    const c = this.cursors.getCursor(getMore);
    if (!c) throw new Error('Invalid cursor');

    return {
      cursor: {
        nextBatch: await c.getBatch(batchSize) ,
        id: c.id,
        ns: {db: this.db, coll: collection},
      },
      ok: 1,
    }
  }

  protected async write(command: WriteCommand, ordered: boolean) {
    const changes = await command.execute();

    const writeErrors = await this.writable.write(changes, {ordered});
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
      this.emit('change', c);
    }

    return res;
  }
}
