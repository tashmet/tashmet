import { Document } from "./interfaces";

export abstract class CursorRegistry {
  protected cursorCounter = 0;
  protected cursors: Record<number, Cursor> = {};

  public closeCursor(id: number) {
    delete this.cursors[id];
  }

  public getCursor(id: number) {
    return this.cursors[id];
  }

  public addCursor(cursor: Cursor) {
    return this.cursors[cursor.id] = cursor;
  }
}

export abstract class Cursor {
  public done: boolean = false;

  public constructor(
    public readonly id: number,
  ) {}

  public abstract next(): Promise<Document>;

  public abstract getBatch(batchSize?: number): Promise<Document[]>;

  public toArray(): Promise<Document[]> {
    return this.getBatch();
  }
}

export class IteratorCursor extends Cursor {
  public constructor(
    public readonly iterator: AsyncIterator<Document>,
    id: number,
  ) { super(id) }

  public async next(): Promise<Document> {
    const {value, done} = await this.iterator.next();
    this.done = done === true;
    return value;
  }

  public async getBatch(
    batchSize: number | undefined = undefined
  ): Promise<Document[]> {

    const batch: Document[] = [];
    let doc = await this.next();

    while (!this.done) {
      batch.push(doc);

      if (!batchSize || (batchSize && batch.length < batchSize)) {
        doc = await this.next();
      } else {
        break;
      }
    }
    return batch;
  }
}
