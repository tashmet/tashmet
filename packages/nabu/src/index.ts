import {
  AbstractCursor,
  Collection,
  Container,
  Dispatcher,
  Document,
  Logger,
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
  File,
  FileAccess,
  NabuConfig,
  NabuDatabaseConfig,
  StreamProvider
} from './interfaces.js';
import { Stream } from './stream.js';
import { DocumentBundleStorage } from './storage/documentBundle.js';
import { CollectionBundleStorage } from './storage/collectionBundle.js';
import { textWriter } from './operators/text.js';
import { jsonReader, jsonWriter } from './operators/json.js';

export * from './interfaces.js';

import globToRegExp from 'glob-to-regexp';

@provider({
  key: ContentReader,
  inject: [Logger.inScope('nabu.NabuContentReader')],
})
export class NabuContentReader implements ContentReader {
  private patterns: string[] = [];
  private readers: ContentReaderFunction[] = [];

  public constructor(private logger: Logger) {}

  public async read(file: File<any>): Promise<File<any>> {
    for (let i=0; i<this.patterns.length; i++) {
      if (globToRegExp(this.patterns[i], {extended: true}).test(file.path)) {
        this.logger.info(`reading '${file.path}' matching '${this.patterns[i]}'`);
        return {...file, content: await this.readers[i](file.content)};
      }
    }
    throw new Error('No matching content reader found');
  }

  public register(pattern: string, reader: (content: any) => Promise<any>) {
    this.patterns.push(pattern);
    this.readers.push(reader);
  }
}

@provider({
  key: ContentWriter,
  inject: [Logger.inScope('nabu.NabuContentWriter')]
})
export class NabuContentWriter implements ContentWriter {
  private patterns: string[] = [];
  private writers: ContentWriterFunction[] = [];

  public constructor(private logger: Logger) {}

  public async write(file: File<any>): Promise<File<any>> {
    this.logger.info(`writing '${file.path}'`);

    if (file.content === undefined) {
      return file;
    }
    for (let i=0; i<this.patterns.length; i++) {
      if (globToRegExp(this.patterns[i], {extended: true}).test(file.path)) {
        return {...file, content: await this.writers[i](file.content)};
      }
    }
    if (typeof file.content === 'string') {
      return {...file, content: await textWriter(file.content) };
    }
    throw new Error('No matching content writer found');
  }

  public register(pattern: string, writer: (content: any) => Promise<any>) {
    this.patterns.push(pattern);
    this.writers.push(writer);
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

        //cr.register('text', textReader);
        cr.register('*.json', content => jsonReader(content));
        cw.register('*.json', content => jsonWriter(content));
      }
    }
  }

  public constructor(
    private aggFact: AggregatorFactory,
    private fileAccess: FileAccess,
  ) {}

  public source(
    src: string | Document[] | AsyncIterable<Document> | AbstractCursor<Document> | Collection<Document>
  ): Stream {
    if (typeof src === "string") {
      return new Stream(this.fileAccess.read(src), this.fileAccess, this.aggFact);
    }

    if (Array.isArray(src)) {
      return Stream.fromArray(src, this.fileAccess, this.aggFact);
    }

    if (src instanceof Collection) {
      return new Stream(src.aggregate([]), this.fileAccess, this.aggFact);
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
