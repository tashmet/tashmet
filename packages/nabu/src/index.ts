import {
  AbstractCursor,
  Container,
  Dispatcher,
  Document,
  provider,
} from '@tashmet/tashmet';
import { MemoryStorage } from '@tashmet/memory';
import {
  StorageEngine,
  AggregatorFactory,
  AggregationEngine,
  ViewMap,
  AdminController,
  AggregationController
} from '@tashmet/engine';
import {
  CollectionBundleConfig,
  ContentReader,
  ContentReaderFunction,
  ContentWriter,
  ContentWriterFunction,
  DocumentBundleConfig,
  FileAccess,
  fileExtension,
  NabuConfig,
  NabuDatabaseConfig,
  StreamProvider
} from './interfaces';
import { Stream } from './stream';
import { DocumentBundleStorage } from './storage/documentBundle';
import { CollectionBundleStorage } from './storage/collectionBundle';
import { yamlReader, yamlWriter } from './operators/yaml';
import { textReader } from './operators/text';
import { jsonReader, jsonWriter } from './operators/json';

export * from './interfaces';

@provider({key: ContentReader})
export class NabuContentReader implements ContentReader {
  private readers: Record<string, ContentReaderFunction> = {};

  public async read(content: any, options: Document): Promise<any> {
    if (options.content && options.content in this.readers) {
      return this.readers[options.content](content, options);
    }
    return content;
  }

  public register(name: string, reader: (content: any, options: Document) => Promise<any>) {
    this.readers[name] = reader;
  }
}

@provider({key: ContentWriter})
export class NabuContentWriter implements ContentWriter {
  private writers: Record<string, ContentReaderFunction> = {};

  public async write(content: any, options: Document): Promise<any> {
    if (options.content && options.content in this.writers) {
      return this.writers[options.content](content, options);
    }
    return content;
  }

  public register(name: string, writer: ContentWriterFunction) {
    this.writers[name] = writer;
  }
}

@provider()
export default class Nabu implements StreamProvider {
  public static configure(config: Partial<NabuConfig> = {}) {
    return (container: Container) => {
      container.register(Nabu);
      container.register(NabuContentReader);
      container.register(NabuContentWriter);
      container.register(FileAccess);

      return () => {
        const nabu = container.resolve(Nabu);
        const cr = container.resolve(ContentReader);
        const cw = container.resolve(ContentWriter);

        for (const [dbName, dbConfig] of Object.entries(config.databases || {})) {
          container
            .resolve(Dispatcher)
            .addStorageEngine(nabu.createBuffer(dbName, dbConfig));
        }

        cr.register('text', textReader);
        cr.register('yaml', yamlReader);
        cr.register('json', jsonReader);

        cw.register('json', jsonWriter);
        cw.register('yaml', yamlWriter);
      }
    }
  }

  public constructor(
    private aggFact: AggregatorFactory,
    private fileAccess: FileAccess,
  ) {}

  public source(
    src: string | Document[] | AsyncIterable<Document> | AbstractCursor<Document>,
    options?: Document,
  ): Stream {
    if (typeof src === "string") {
      options = options || {};

      if (options.content === undefined) {
        try {
          options.content = fileExtension(src);
        } catch (err) {
          // do nothing
        }
      }

      return new Stream(this.fileAccess.read(src, options), this.fileAccess, this.aggFact);
    }

    if (Array.isArray(src)) {
      return Stream.fromArray(src, this.fileAccess, this.aggFact);
    }

    return new Stream(src, this.fileAccess, this.aggFact);
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
