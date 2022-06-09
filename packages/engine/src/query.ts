import { Cursor, CursorRegistry } from "./cursor";
import { CollationOptions, Document } from "./interfaces";

export abstract class QueryEngine extends CursorRegistry {
  public constructor() { super(); }

  public abstract find(collName: string, query: Document, collation?: CollationOptions, batchSize?: number): Cursor;
}
