import { Document } from "@tashmet/tashmet";

export abstract class CursorRegistry {
  protected cursorCounter = 0;
  protected cursors: Record<number, Cursor> = {};

  closeCursor(id: number) {
    delete this.cursors[id];
  }

  getCursor(id: number) {
    return this.cursors[id];
  }

  addCursor(cursor: Cursor) {
    return this.cursors[cursor.id] = cursor;
  }
}

export abstract class Cursor {
  public done: boolean = false;

  constructor(
    public readonly id: number,
  ) {}

  abstract next(): Promise<Document>;

  abstract getBatch(batchSize?: number): Promise<Document[]>;

  toArray(): Promise<Document[]> {
    return this.getBatch();
  }
}

export class IteratorCursor extends Cursor {
  constructor(
    public readonly iterator: AsyncIterator<Document>,
    id: number,
  ) { super(id) }

  async next(): Promise<Document> {
    const {value, done} = await this.iterator.next();
    this.done = done === true;
    return value;
  }

  async getBatch(
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
