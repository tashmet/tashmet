import { Optional, provider } from '@tashmet/core';
import { TashmetCollectionNamespace, CreateCollectionOptions, Document } from '@tashmet/tashmet';
import {
  CollectionFactory,
  ReadWriteCollection,
  AggregatorFactory,
  ValidatorFactory,
  Validator,
} from '@tashmet/engine';
import { MemoryCollectionFactory } from '@tashmet/memory';
import {
  NabuConfig,
  BufferIO,
  StreamIO,
} from '../interfaces.js';
import { StreamCollection } from './streamCollection.js';
import { BufferCollection } from './bufferCollection.js';
import { makeIO } from '../io/index.js';


@provider({
  inject: [
    MemoryCollectionFactory,
    NabuConfig,
    AggregatorFactory,
    Optional.of(ValidatorFactory)
  ]
})
export class NabuCollectionFactory extends CollectionFactory {
  public constructor(
    private memory: MemoryCollectionFactory,
    private config: NabuConfig,
    private aggregatorFactory: AggregatorFactory,
    private validatorFactory: ValidatorFactory | undefined,
  ) { super(); }

  createCollection(ns: TashmetCollectionNamespace, options: CreateCollectionOptions): ReadWriteCollection {
    const store: Document | string = options.storageEngine || this.config.defaultIO;

    if (store === 'memory') {
      return this.memory.createCollection(ns, options);
    }

    const makeIOHelper = (store: Document | string): StreamIO | BufferIO => {
      if (typeof store === 'string') {
        if (store in this.config.io) {
          return makeIO(this.config.io[store](ns, options.storageEngine || {}));
        } else {
          throw new Error('Unsupported IO: ' + store);
        }
      }
      return makeIO(store);
    }

    const io = makeIOHelper(store);

    let validator: Validator | undefined;

    if (this.validatorFactory && options.validator) {
      validator = this.validatorFactory.createValidator(options.validator);
    }
    
    const input = this.aggregatorFactory.createAggregator(io.input);
    const output = this.aggregatorFactory.createAggregator(io.output);

    if (io instanceof StreamIO) {
      return new StreamCollection(ns, io.path, input, output, validator);
    }

    if (io instanceof BufferIO) {
      const buffer = this.memory.createCollection(ns, options);

      return new BufferCollection(ns, io.path, input, output, buffer);
    }

    throw Error('Unsupported IO type');
  }
}
