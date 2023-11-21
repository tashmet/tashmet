import {
  ReadWriteCollection,
  ReadOptions,
  WriteError,
  WriteOptions,
  Validator,
  AbstractAggregator,
  arrayToGenerator,
} from '@tashmet/engine';
import { ChangeStreamDocument, Document, TashmetCollectionNamespace } from '@tashmet/tashmet';


export class StreamCollection extends ReadWriteCollection {
  constructor(
    ns: TashmetCollectionNamespace,
    private path: (id?: string) => string,
    private input: AbstractAggregator,
    private output: AbstractAggregator,
    private validator: Validator | undefined,
  ) {
    super(ns);
  }

  read(options: ReadOptions = {}): AsyncIterable<Document> {
    const { documentIds, projection } = options || {};
    const paths = documentIds
      ? documentIds.map(id => ({ _id: this.path(id) }))
      : ([{ _id: this.path() }]);

    return this.input.stream(arrayToGenerator(paths));
  }

  async write(changes: ChangeStreamDocument<Document>[], options: WriteOptions = {}): Promise<WriteError[]> {
    const writeErrors: WriteError[] = [];
    const index = 0;

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

      for await (const err of this.output.stream<WriteError>(arrayToGenerator([doc]))) {
        writeErrors.push({ ...err, index });
      }

      if (options.ordered && writeErrors.length > 0) {
        break;
      }
    }
    return writeErrors;
  }
}
