import { Optional, provider } from '@tashmet/core';
import { TashmetCollectionNamespace, CreateCollectionOptions } from '@tashmet/tashmet';
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
    const mergedOptions = {...options, storageEngine: options.storageEngine || { io: this.config.defaultIO } };

    if (mergedOptions.storageEngine.io === 'memory') {
      return this.memory.createCollection(ns, mergedOptions);
    }

    const ioName = mergedOptions.storageEngine?.io;
    const io = this.config.io[ioName](ns, mergedOptions.storageEngine || {});
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
      const buffer = this.memory.createCollection(ns, mergedOptions);

      return new BufferCollection(ns, io.path, input, output, buffer);
    }

    throw Error('Unsupported IO');
  }
}
