import { ChangeStreamDocument, Document } from '@tashmet/tashmet';
import { ReadWriteCollection, StorageEngineError, WriteError, WriteOptions } from './interfaces.js';

export * from './interfaces.js';

export { AggregationEngine } from './aggregation.js';
export { QueryPlanner, QueryPlan } from './plan.js';
export { command, CommandRunner } from './command.js';
export { QueryEngine, Queryable } from './query.js';
export { Cursor, CursorRegistry } from './cursor.js';
export { Store } from './store.js';
export { ChangeSet, idSet } from './changeSet.js';
export {
  op,
  ExpressionOperator,
  PipelineOperator,
  QueryOperator,
  OperatorPluginConfigurator,
  OperatorContext,
} from './operator.js';

export { AggregationReadController, AggregationWriteController } from './controllers/aggregate.js';
export { AdminController } from './controllers/admin.js';
export { QueryReadController, QueryWriteController } from './controllers/query.js';

export { makeWriteChange } from './commands/write.js';


export abstract class AtomicWriteCollection extends ReadWriteCollection {
  abstract insert(document: Document, validate: boolean): Promise<void>;
  abstract replace(id: string, document: Document): Promise<void>;
  abstract delete(id: string): Promise<void>;

  async write(changes: ChangeStreamDocument[], options: WriteOptions = {}) {
    const writeErrors: WriteError[] = [];

    let index=0;
    for (const c of changes.filter(c => c.ns.db === this.ns.db && c.ns.coll === this.ns.collection)) {
      try {
        switch (c.operationType) {
          case 'insert':
            if (c.fullDocument) {
              await this.insert(c.fullDocument, options.bypassDocumentValidation !== true);
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
      } catch (err: any) {
        writeErrors.push({errMsg: err.message, errInfo: err.info, index});
        if (options.ordered)
          break;
      }
      index++;
    }
    return writeErrors;
  }
}
