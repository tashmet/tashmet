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
} from '../interfaces.js';
import { StreamCollection } from './streamCollection.js';
import { makeIO } from '../io/index.js';
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
    let store: Document | string = options.storageEngine || this.config.defaultIO;
    const persistentState = this.config.persistentState;

    if (ns.collection.startsWith('system')) {
      if (persistentState) {
        const path = persistentState(ns.db);
        const parts = path.split('.');
        const format = parts[parts.length - 1];

        store = {
          objectInFile: { path, format, field: ns.collection.split('.')[1] }
        };
      } else {
        store = 'memory';
      }
    }

    if (store === 'memory') {
      return this.memory.createCollection(ns, options);
    }

    const resolveStoreConfig = (store: Document | string) => {
      if (typeof store === 'string') {
        if (store in this.config.io) {
          return this.config.io[store](ns, options.storageEngine || {});
        } else {
          throw new Error('Unsupported IO: ' + store);
        }
      }
      return store;
    }

    const config = resolveStoreConfig(store);
    const io = makeIO(config);

    if (io instanceof BufferIO) {
      const buffer = this.memory.createCollection(ns, options);
      return new BufferCollection(ns, this.aggregatorFactory, io, buffer);
    } else {
      let validator: Validator | undefined;

      if (this.validatorFactory && options.validator) {
        validator = this.validatorFactory.createValidator(options.validator);
      }
      return new StreamCollection(ns, this.aggregatorFactory, io, validator);
    }
  }
}
