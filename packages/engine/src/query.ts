import { Cursor, CursorRegistry } from "./cursor";
import { CollationOptions, Document } from "./interfaces";

export abstract class QueryEngine implements CursorRegistry {
  protected cursorCounter = 0;
  protected cursors: Record<number, Cursor> = {};

  public constructor() {}

  public abstract find(collName: string, query: Document, collation?: CollationOptions, batchSize?: number): Cursor;

  public closeCursor(id: number) {
    delete this.cursors[id];
  }

  public getCursor(id: number) {
    return this.cursors[id];
  }
}
