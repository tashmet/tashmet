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
import { StreamIO } from '../interfaces';


export class StreamCollection extends ReadWriteCollection {
  private input: AbstractAggregator;
  private output: AbstractAggregator;

  constructor(
    ns: TashmetCollectionNamespace,
    aggregatorFactory: AggregatorFactory,
    io: StreamIO,
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

    for (const doc of changes) {
      let error: WriteError | false = false;

      if (this.validator && !options.bypassDocumentValidation && ['insert', 'update', 'replace'].includes(doc.operationType)) {
        try {
          await this.validator(doc.fullDocument as Document);
        } catch (err) {
          error = { errMsg: err.message, errInfo: err.info, index: 0 };
          if (options.ordered) {
            return [error]
          }
          continue;
        }
      }

      docs.push({ change: doc, ordered: options.ordered, error });
    }

    return this.output.run<WriteError>(arrayToGenerator(docs));
  }
}
