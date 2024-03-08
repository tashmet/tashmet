import {
  ReadWriteCollection,
  ReadOptions,
  WriteError,
  WriteOptions,
  makeWriteChange,
  AbstractAggregator,
  AggregatorFactory,
} from '@tashmet/engine';
import { ChangeStreamDocument, Document, TashmetCollectionNamespace } from '@tashmet/tashmet';
import { BufferIO } from '../interfaces';


export class BufferCollection extends ReadWriteCollection {
  private synced = false;
  private input: AbstractAggregator;
  private output: AbstractAggregator;

  constructor(
    ns: TashmetCollectionNamespace,
    aggregatorFactory: AggregatorFactory,
    io: BufferIO,
    private buffer: ReadWriteCollection,
  ) {
    super(ns);
    this.input = aggregatorFactory.createAggregator(io.input);
    this.output = aggregatorFactory.createAggregator(io.output);
  }

  async* read(options: ReadOptions = {}): AsyncIterable<Document> {
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

  async write(changes: ChangeStreamDocument<Document>[], options: WriteOptions = {}): Promise<WriteError[]> {
    const drop = changes.find(c => c.operationType === 'drop');

    if (drop) {
      //await this.io.drop();
      return [];
    }

    const writeErrors = await this.buffer.write(changes, options);
    const documents: Document[] = [];

    for await (const doc of this.buffer.read()) {
      documents.push(doc);
    }

    return writeErrors.concat(await this.output.run<WriteError>(documents));
  }
}
