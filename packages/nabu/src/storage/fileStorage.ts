import { Optional, provider } from '@tashmet/core';
import {
  AggregatorFactory,
  CollectionFactory,
  ReadWriteCollection,
  ReadOptions,
  WriteError,
  WriteOptions,
  Validator,
  ValidatorFactory
} from '@tashmet/engine';
import { ChangeStreamDocument, CreateCollectionOptions, Document, TashmetCollectionNamespace } from '@tashmet/tashmet';
import { NabuConfig } from '../interfaces.js';
import { IO } from '../io.js';

@provider({
  inject: [AggregatorFactory, Optional.of(ValidatorFactory), NabuConfig]
})
export class FileCollectionFactory extends CollectionFactory {
  public constructor(
    private aggregatorFactory: AggregatorFactory,
    private validatorFactory: ValidatorFactory | undefined,
    private config: NabuConfig,
  ) { super(); }

  public createCollection(ns: TashmetCollectionNamespace, options: CreateCollectionOptions): ReadWriteCollection {
    const ioName = options.storageEngine?.io;
    const ioFactory = this.config.io[ioName](ns, options.storageEngine || {});
    let validator: Validator | undefined;

    if (this.validatorFactory && options.validator) {
      validator = this.validatorFactory.createValidator(options.validator);
    }

    return new FileCollection(ns, ioFactory.createIO(this.aggregatorFactory), validator);
  }
}


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
