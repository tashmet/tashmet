import {
  ReadWriteCollection,
  ReadOptions,
  WriteError,
  WriteOptions,
  Validator,
} from '@tashmet/engine';
import { ChangeStreamDocument, Document, TashmetCollectionNamespace } from '@tashmet/tashmet';
import { IO } from '../io.js';


export class FileCollection extends ReadWriteCollection {
  public constructor(
    ns: TashmetCollectionNamespace,
    private io: IO,
    private validator: Validator | undefined,
  ) {
    super(ns);
  }

  public read(options: ReadOptions = {}): AsyncIterable<Document> {
    const { documentIds, projection } = options || {};

    if (documentIds) {
      return this.io.lookup(documentIds);
    } else {
      return this.io.scan();
    }
  }

  public async write(changes: ChangeStreamDocument<Document>[], options: WriteOptions): Promise<WriteError[]> {
    const writeErrors: WriteError[] = [];
    let index=0;

    for (const doc of changes) {
      if (doc.ns.db !== this.ns.db || doc.ns.coll !== this.ns.collection) {
        continue;
      }

      if (this.validator && !options.bypassDocumentValidation && ['insert', 'update', 'replace'].includes(doc.operationType)) {
        try {
          this.validator(doc.fullDocument as Document);
        } catch (err) {
          writeErrors.push({ errMsg: err.message, index });
          if (options.ordered) {
            break;
          }
          continue;
        }
      }

      for await (const err of this.io.write([doc])) {
        writeErrors.push({ ...err, index });
      }

      if (options.ordered && writeErrors.length > 0) {
        break;
      }
    }
    return writeErrors;
  }
}
