import { CollationOptions, Document } from "@tashmet/tashmet";
import { Cursor, CursorRegistry } from "./cursor.js";

export class QueryEngine extends CursorRegistry {
  public constructor(private queryable: Queryable) { super(); }

  public find(collName: string, query: Document, collation?: CollationOptions): Cursor {
    return this.addCursor(
      new QueryCursor(this.queryable, collName, {...query, collation}, ++this.cursorCounter)
    );
  }
}

export interface Queryable {
  executeQuery(collName: string, query: Document): Promise<Document[]>;
}

export class QueryCursor extends Cursor {
  private skip: number = 0;

  public constructor(
    private source: Queryable,
    private collName: string,
    private query: Document,
    id: number,
  ) { super(id) }

  public async next(): Promise<Document> {
    throw new Error("Method not implemented.");
  }

  public async getBatch(
    batchSize: number | undefined = undefined
  ): Promise<Document[]> {
    const q = this.getQuery(batchSize);
    return q ? this.source.executeQuery(this.collName, q) : [];
  }

  public getQuery(batchSize: number | undefined): Document | undefined {
    batchSize = batchSize || 1000;

    const skip = this.skip + (this.query.skip || 0);
    const limit = this.query.limit ? Math.min(batchSize, this.query.limit) : batchSize;

    const q = {...this.query, skip, limit};
    this.skip += batchSize;

    return q;
  }
}
