import {
  ReadWriteCollection,
  ReadOptions,
  WriteError,
  WriteOptions,
  Validator,
  AbstractAggregator,
  arrayToGenerator,
  AggregatorFactory,
} from '@tashmet/engine';
import { ChangeStreamDocument, Document, TashmetCollectionNamespace } from '@tashmet/tashmet';
import { IOSegment } from '../interfaces';


export class StreamCollection extends ReadWriteCollection {
  private input: AbstractAggregator;
  private output: AbstractAggregator;

  constructor(
    ns: TashmetCollectionNamespace,
    aggregatorFactory: AggregatorFactory,
    io: IOSegment,
    private validator: Validator | undefined,
  ) {
    super(ns);
    this.input = aggregatorFactory.createAggregator(io.input);
    this.output = aggregatorFactory.createAggregator(io.output);
  }

  read(options: ReadOptions = {}): AsyncIterable<Document> {
    const { documentIds, projection } = options || {};
    const ids: Document[] = documentIds
      ? documentIds.map(_id => ({ _id }))
      : ([{ _id: undefined }]);

    return this.input.stream(arrayToGenerator(ids));
  }

  async write(changes: ChangeStreamDocument<Document>[], options: WriteOptions = {}): Promise<WriteError[]> {
    const docs: Document[] = [];
    const writeErrors: WriteError[] = [];

    for (let i=0; i<changes.length; i++) {
      const doc = changes[i];
      let validation: WriteError | true = true;

      if (this.validator && !options.bypassDocumentValidation && ['insert', 'update', 'replace'].includes(doc.operationType)) {
        try {
          await this.validator(doc.fullDocument as Document);
        } catch (err) {
          validation = { errMsg: err.message, errInfo: err.info, index: i };
          if (options.ordered) {
            return [validation];
          } else {
            writeErrors.push(validation);
          }
        }
      }

      docs.push({ change: doc, index: i, ordered: options.ordered, valid: validation === true});
    }

    return writeErrors.concat(await this.output.run<WriteError>(arrayToGenerator(docs)));
  }
}
