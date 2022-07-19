import {
  Comparator,
  Container,
  Dispatcher,
  Logger,
  provider,
} from '@tashmet/tashmet';
import { MemoryStorageEngine, MingoDatabaseEngine } from '@tashmet/mingo-engine';
import { DatabaseEngine, Document } from '@tashmet/engine';
import Mingo from '@tashmet/mingo';

import { CollectionBundleConfig, DocumentBundleConfig, File, FileAccess, NabuConfig, NabuDatabaseConfig} from './interfaces';

export * from './interfaces';
export {json} from './operators/json';
export {yaml} from './operators/yaml';

import { useOperators, OperatorType } from 'mingo/core';
import { $jsonParse, $jsonDump } from './operators/json';
import { $yamlParse, $yamlDump } from './operators/yaml';

import { Stream } from './generators/stream';
import { FileStream, DocumentStream, Writable } from './generators/interfaces';
import { DocumentBundleStorageEngine } from './storageEngines/documentBundle';
import { CollectionBundleStorageEngine } from './storageEngines/collectionBundle';

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
            .addDatabaseEngine(nabu.createBuffer(dbName, dbConfig));
        }
      }
    }
  }

  public constructor(
    //private config: NabuConfig,
    private memory: Mingo,
    private logger: Logger,
    private fileAccess: FileAccess,
    private comparator: Comparator,
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

  public createBuffer(dbName: string, config: NabuDatabaseConfig): DatabaseEngine {
    let storage: MemoryStorageEngine;

    if (config.hasOwnProperty('documentBundle')) {
      storage = new DocumentBundleStorageEngine(dbName, this.fileAccess, config as DocumentBundleConfig);
    } else {
      storage = new CollectionBundleStorageEngine(dbName, this.fileAccess, config as CollectionBundleConfig);
    }
    return MingoDatabaseEngine.fromMemory(storage);
  }
}
