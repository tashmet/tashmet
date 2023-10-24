import { provider } from '@tashmet/core';
import {
  AggregatorFactory,
  CollectionFactory,
  ReadWriteCollection,
  StreamOptions,
  WriteError,
  WriteOptions
} from '@tashmet/engine';
import { ChangeStreamDocument, Document, TashmetCollectionNamespace } from '@tashmet/tashmet';
import { NabuConfig } from '../interfaces.js';
import { IO } from '../io.js';

@provider()
export class FileCollectionFactory extends CollectionFactory {
  public constructor(
    private aggregatorFactory: AggregatorFactory,
    private config: NabuConfig,
  ) { super(); }

  public createCollection(ns: TashmetCollectionNamespace, options: any): ReadWriteCollection {
    return new FileCollection(ns, this.config.databases[ns.db](ns.collection)(this.aggregatorFactory));
  }
}


export class FileCollection extends ReadWriteCollection {
  public constructor(
    ns: TashmetCollectionNamespace,
    private io: IO,
  ) {
    super(ns);
  }

  public read(options: StreamOptions): AsyncIterable<Document> {
    const { documentIds, projection } = options || {};

    if (documentIds) {
      return this.io.lookup(documentIds);
    } else {
      return this.io.scan();
    }
  }

  public async write(changes: ChangeStreamDocument<Document>[], options: WriteOptions): Promise<WriteError[]> {
    if (changes.length === 0) {
      return [];
    }

    const stream = this.io.write(changes.filter(cs => cs.ns.db === this.ns.db && cs.ns.coll === this.ns.collection));
    const writeErrors: WriteError[] = [];
    for await (const doc of stream) {
      writeErrors.push(doc);
    }

    return writeErrors;
  }
}
