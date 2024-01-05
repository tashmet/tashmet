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
    protected config: Document,
    protected path: (id?: string) => string,
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
    const drop = changes.find(c => c.operationType === 'drop');

    if (drop) {
      await this.drop();
      return [];
    }

    const writeErrors: WriteError[] = [];
    const index = 0;

    for (const doc of changes) {
      if (doc.ns.db !== this.ns.db || doc.ns.coll !== this.ns.collection) {
        continue;
      }

      if (this.validator && !options.bypassDocumentValidation && ['insert', 'update', 'replace'].includes(doc.operationType)) {
        try {
          await this.validator(doc.fullDocument as Document);
        } catch (err) {
          writeErrors.push({ errMsg: err.message, errInfo: err.info, index });
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

  protected async drop() {}
}
