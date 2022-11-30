import {
  Container,
  Dispatcher,
  provider,
} from '@tashmet/tashmet';
import { MemoryStorage } from '@tashmet/memory';
import {
  StorageEngine,
  Document,
  AggregatorFactory,
  AggregationEngine,
  ViewMap,
  AdminController,
  AggregationController
} from '@tashmet/engine';
import {
  CollectionBundleConfig,
  DocumentBundleConfig,
  FileAccess,
  NabuConfig,
  NabuDatabaseConfig,
  StreamProvider
} from './interfaces';
import { Stream } from './stream';
import { DocumentBundleStorage } from './storage/documentBundle';
import { CollectionBundleStorage } from './storage/collectionBundle';

export * from './interfaces';
export { jsonParser, jsonSerializer } from './operators/json';
export { yamlParser, yamlSerializer } from './operators/yaml';


@provider()
export default class Nabu implements StreamProvider {
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
    private aggFact: AggregatorFactory,
    private fileAccess: FileAccess,
  ) {}

  public read(pathOrGlob: string): Stream {
    return new Stream(this.fileAccess.read(pathOrGlob), this.fileAccess, this.aggFact);
  }

  public generate(docs: Document[]): Stream {
    return Stream.fromArray(docs, this.fileAccess, this.aggFact);
  }

  public createBuffer(dbName: string, config: NabuDatabaseConfig): StorageEngine {
    let storage: MemoryStorage;

    if (config.hasOwnProperty('documentBundle')) {
      storage = new DocumentBundleStorage(dbName, this, config as DocumentBundleConfig);
    } else {
      storage = new CollectionBundleStorage(dbName, this, config as CollectionBundleConfig);
    }

    const engine = new AggregationEngine(this.aggFact, storage, {
      collectionResolver: (name: string) => storage.resolve(name),
    });
    const views: ViewMap = {};
    return StorageEngine.fromControllers(dbName,
      new AdminController(dbName, storage, views),
      new AggregationController(dbName, storage, engine, views)
    );
  }
}
