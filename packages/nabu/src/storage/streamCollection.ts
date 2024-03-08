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
  //private update: AbstractAggregator;
  //private delete: AbstractAggregator;

  constructor(
    ns: TashmetCollectionNamespace,
    aggregatorFactory: AggregatorFactory,
    io: StreamIO,
    private validator: Validator | undefined,
  ) {
    super(ns);
    this.input = aggregatorFactory.createAggregator(io.input);
    this.output = aggregatorFactory.createAggregator(io.output('insert'));
    //this.update = aggregatorFactory.createAggregator(io.output('update'));
    //this.delete = aggregatorFactory.createAggregator(io.output('delete'));
  }

  read(options: ReadOptions = {}): AsyncIterable<Document> {
    const { documentIds, projection } = options || {};
    const ids: Document[] = documentIds
      ? documentIds.map(_id => ({ _id }))
      : ([{ _id: undefined }]);

    return this.input.stream(arrayToGenerator(ids));
  }

  async write(changes: ChangeStreamDocument<Document>[], options: WriteOptions = {}): Promise<WriteError[]> {
     return this.output.run<WriteError>(arrayToGenerator(changes));
    /*
    const drop = changes.find(c => c.operationType === 'drop');

    if (drop) {
      await this.io.drop();
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

      const output = () => {
        switch (doc.operationType) {
          case 'insert':
            return this.insert;
          case 'update':
          case 'replace':
            return this.update;
          case 'delete':
            return this.delete;
          default:
            return this.delete;
        }
      }

      for await (const err of output().stream<WriteError>(arrayToGenerator([doc.fullDocument || doc.documentKey as any]))) {
        writeErrors.push({ ...err, index });
      }

      if (options.ordered && writeErrors.length > 0) {
        break;
      }
    }
    return writeErrors;
    */
  }
}
