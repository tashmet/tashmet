import {
  ReadWriteCollection,
  ReadOptions,
  WriteError,
  WriteOptions,
  makeWriteChange,
} from '@tashmet/engine';
import { ChangeStreamDocument, Document, TashmetCollectionNamespace } from '@tashmet/tashmet';
import { BufferIO } from '../io.js';


export class FileBufferCollection extends ReadWriteCollection {
  private synced = false;

  public constructor(
    ns: TashmetCollectionNamespace,
    private io: BufferIO,
    private buffer: ReadWriteCollection,
  ) {
    super(ns);
  }

  public async* read(options: ReadOptions = {}): AsyncIterable<Document> {
    if (!this.synced) {
      const documents: Document[] = [];

      for await (const doc of this.io.scan()) {
        documents.push(doc);
      }
      
      await this.buffer.write(documents.map(d => makeWriteChange('insert', d, { db: this.ns.db, coll: this.ns.collection })), {});
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

    for await (const err of this.io.write(documents)) {
      //writeErrors.push(err);
      console.log(err);
    }
    return writeErrors;
  }
}
