import {
  Comparator,
  Container,
  Dispatcher,
  Logger,
  provider,
} from '@tashmet/tashmet';
import { MemoryStorage } from '@tashmet/memory';
import { StorageEngine, Document, AggregatorFactory, AggregationEngine, ViewMap, AdminController, AggregationController } from '@tashmet/engine';

import { CollectionBundleConfig, DocumentBundleConfig, File, FileAccess, NabuConfig, NabuDatabaseConfig} from './interfaces';

export * from './interfaces';
export {json} from './operators/json';
export {yaml} from './operators/yaml';

import { useOperators, OperatorType } from 'mingo/core';
import { $jsonParse, $jsonDump } from './operators/json';
import { $yamlParse, $yamlDump } from './operators/yaml';

import { Stream } from './generators/stream';
import { FileStream, DocumentStream, Writable } from './generators/interfaces';
import { DocumentBundleStorage } from './storage/documentBundle';
import { CollectionBundleStorage } from './storage/collectionBundle';

useOperators(OperatorType.PIPELINE, { $yamlParse, $yamlDump });
useOperators(OperatorType.EXPRESSION, { $jsonParse, $jsonDump });

@provider()
export default class Nabu {
  public static configure(config: Partial<NabuConfig> = {}) {
    return (container: Container) => {
      container.register(Nabu);

      return () => {
        const nabu = container.resolve(Nabu);

        for (const [dbName, dbConfig] of Object.entries(config.databases || {})) {
          container
            .resolve(Dispatcher)
            .addStorageEngine(nabu.createBuffer(dbName, dbConfig));
        }
      }
    }
  }

  public constructor(
    //private config: NabuConfig,
    private aggFact: AggregatorFactory,
    //private memory: Mingo,
    //private logger: Logger,
    private fileAccess: FileAccess,
    //private comparator: Comparator,
  ) {}

  /*
  public async write(documents: Document[] | AsyncIterable<File<Buffer>>) {
    return this.fileAccess.write(Pipeline.fromMany(documents as any));
  }
  */
  public async *write(path?: string): Writable<File<Buffer>> {
    while (true) {
      const file = yield;
      console.log(file);
    }
  }

  public read(pathOrGlob: string): FileStream {
    return new Stream(this.fileAccess.read(pathOrGlob));
  }

  public generate<TSchema extends Document>(docs: TSchema[]): DocumentStream<TSchema> {
    return Stream.fromArray(docs);
  }

  public createBuffer(dbName: string, config: NabuDatabaseConfig): StorageEngine {
    let storage: MemoryStorage;

    if (config.hasOwnProperty('documentBundle')) {
      storage = new DocumentBundleStorage(dbName, this.fileAccess, config as DocumentBundleConfig);
    } else {
      storage = new CollectionBundleStorage(dbName, this.fileAccess, config as CollectionBundleConfig);
    }

    const engine = new AggregationEngine(this.aggFact, storage, {
      collectionResolver: (name: string) => storage.resolve(name),
    });
    const views: ViewMap = {};
    return StorageEngine.fromControllers(dbName,
      new AdminController(storage, views),
      new AggregationController(dbName, storage, engine, views)
    );
  }
}
