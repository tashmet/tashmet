import { ChangeStreamDocument, Document } from '@tashmet/tashmet';
import { ReadWriteCollection, WriteError, WriteOptions } from './interfaces.js';

export * from './interfaces.js';

export { AggregationEngine, QueryPlanner, arrayToGenerator } from './aggregation.js';
export { command, CommandRunner } from './command.js';
export { QueryEngine, Queryable } from './query.js';
export { Cursor, CursorRegistry } from './cursor.js';
export { Store } from './store.js';
export { ChangeSet, idSet } from './changeSet.js';
export { op, ExpressionOperator, PipelineOperator, OperatorPluginConfigurator } from './operator.js';

export { AggregationReadController, AggregationWriteController } from './controllers/aggregate.js';
export { AdminController } from './controllers/admin.js';
export { QueryReadController, QueryWriteController } from './controllers/query.js';

export { makeWriteChange } from './commands/write.js';


export abstract class AtomicWriteCollection extends ReadWriteCollection {
  public abstract insert(document: Document): Promise<void>;
  public abstract replace(id: string, document: Document): Promise<void>;
  public abstract delete(id: string): Promise<void>;

  public async write(changes: ChangeStreamDocument[], options: WriteOptions) {
    const writeErrors: WriteError[] = [];

    let index=0;
    for (const c of changes.filter(c => c.ns.db === this.ns.db && c.ns.coll === this.ns.collection)) {
      try {
        switch (c.operationType) {
          case 'insert':
            if (c.fullDocument) {
              await this.insert(c.fullDocument);
            }
            break;
          case 'update':
          case 'replace':
            if (c.fullDocument && c.documentKey)
              await this.replace(c.documentKey._id as any, c.fullDocument);
            break;
          case 'delete':
            if (c.documentKey)
              await this.delete(c.documentKey._id as any);
        }
      } catch (err) {
        writeErrors.push({errMsg: err.message, index});
        if (options.ordered)
          break;
      }
      index++;
    }
    return writeErrors;
  }
}
