import { ChangeStreamDocument } from './changeStream';
import { Document, WriteError } from './interfaces';

export * from './interfaces';

export { AggregationEngine } from './aggregation';
export { QueryEngine, Queryable } from './query';
export { Cursor, CursorRegistry } from './cursor';
export { ChangeSet, idSet } from './changeSet';
export * from './changeStream';

export { AggregationController } from './controllers/aggregate';
export { AdminController } from './controllers/admin';
export { QueryController } from './controllers/query';

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
            await coll.replace(c.documentKey._id as any, c.fullDocument);
          break;
        case 'delete':
          if (c.documentKey)
            await coll.delete(c.documentKey._id as any);
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
