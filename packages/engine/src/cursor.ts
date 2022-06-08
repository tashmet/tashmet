import { Document } from "./interfaces";

export interface CursorRegistry {
  getCursor(id: number): Cursor;

  closeCursor(id: number): void;
}

export class Cursor {
  public constructor(
    public readonly iterator: AsyncIterator<Document>,
    public readonly id: number,
    private registry: CursorRegistry,
  ) {}

  public next(): Promise<IteratorResult<Document>> {
    return this.iterator.next();
  }

  public async getBatch(
    batchSize: number | undefined = undefined
  ): Promise<Document[]> {

    const batch: Document[] = [];
    let result = await this.next();

    while (!result.done) {
      batch.push(result.value as Document);

      if (!batchSize || (batchSize && batch.length < batchSize)) {
        result = await this.next();
      } else {
        break;
      }
    }
    return batch;
  }

  public toArray(): Promise<Document[]> {
    return this.getBatch();
  }

  public close() {
    return this.registry.closeCursor(this.id);
  }
}
