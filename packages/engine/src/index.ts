import { ChangeStreamDocument } from './changeStream';
import { Document, WriteError } from './interfaces';

export * from './interfaces';

export { AggregationEngine } from './aggregation';
export { AbstractQueryEngine, QueryEngine, Queryable } from './query';
export { Cursor, CursorRegistry } from './cursor';
export { ChangeSet, idSet } from './changeSet';
export * from './changeStream';

export {
  makeAggregateCommand,
  makeFindCommand,
  makeGetMoreCommand,
  makeCountAggregationCommand,
  makeCountQueryCommand,
} from './commands/cursor';
export { makeInsertCommand } from './commands/insert';
export { makeDeleteCommand } from './commands/delete';
export { makeDistinctCommand } from './commands/distinct';
export { makeCreateCommand, makeDropCommand } from './commands/db';
export { makeUpdateAggregationCommand, makeUpdateQueryCommand } from './commands/update';
export { makeWriteChange } from './commands/write';

export interface AtomicWriteCollection {
  readonly name: string;

  insert(document: Document): Promise<void>;
  replace(id: string, document: Document): Promise<void>;
  delete(id: string): Promise<void>;
}

export async function sequentialWrite(collections: Record<string, AtomicWriteCollection>, changes: ChangeStreamDocument[], ordered: boolean) {
  const writeErrors: WriteError[] = [];

  let index=0;
  for (const c of changes) {
    try {
      const coll = collections[c.ns.coll];
      switch (c.operationType) {
        case 'insert':
          if (c.fullDocument) {
            await coll.insert(c.fullDocument);
          }
          break;
        case 'update':
        case 'replace':
          if (c.fullDocument && c.documentKey)
            await coll.replace(c.documentKey as any, c.fullDocument);
          break;
        case 'delete':
          if (c.documentKey)
            await coll.delete(c.documentKey as any);
      }
    } catch (err) {
      writeErrors.push({errMsg: err.message, index});
      if (ordered)
        break;
    }
    index++;
  }
  return writeErrors;
}
