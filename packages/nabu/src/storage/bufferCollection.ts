import {
  ReadWriteCollection,
  ReadOptions,
  WriteError,
  WriteOptions,
  makeWriteChange,
  AbstractAggregator,
} from '@tashmet/engine';
import { ChangeStreamDocument, Document, TashmetCollectionNamespace } from '@tashmet/tashmet';


export class BufferCollection extends ReadWriteCollection {
  private synced = false;

  public constructor(
    ns: TashmetCollectionNamespace,
    private path: string,
    private input: AbstractAggregator,
    private output: AbstractAggregator,
    private buffer: ReadWriteCollection,
  ) {
    super(ns);
  }

  public async* read(options: ReadOptions = {}): AsyncIterable<Document> {
    if (!this.synced) {
      const documents = await this.input.run<Document>([]);
      
      await this.buffer.write(documents.map(d =>
        makeWriteChange('insert', d, { db: this.ns.db, coll: this.ns.collection })
      ), {});
      this.synced = true;
    }

    for await (const doc of this.buffer.read(options)) {
      yield doc;
    }
  }

  public async write(changes: ChangeStreamDocument<Document>[], options: WriteOptions): Promise<WriteError[]> {
    const writeErrors = await this.buffer.write(changes, options);
    const documents: Document[] = [];

    for await (const doc of this.buffer.read()) {
      documents.push(doc);
    }

    return writeErrors.concat(await this.output.run<WriteError>(documents));
  }
}
