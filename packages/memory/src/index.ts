import {
  provider,
  PluginConfigurator,
  BootstrapConfig,
  createContainer,
  LogLevel,
  Lookup,
  Provider
} from '@tashmet/core';
import {
  AdminController,
  AggregationReadController,
  AggregationWriteController,
  AggregationEngine,
  QueryPlanner,
  ValidatorFactory,
  ViewMap,
  ReadOptions,
  StorageEngine,
  CommandRunner,
  ReadWriteCollection,
  CollectionFactory,
  Store,
  AtomicWriteCollection,
  Validator
} from '@tashmet/engine';
import {
  CreateCollectionOptions,
  Document,
  TashmetCollectionNamespace,
  TashmetNamespace,
} from '@tashmet/tashmet';

function hash(value: string | object): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}


export class MemoryCollection extends AtomicWriteCollection {
  private indexes: Map<string, number> = new Map();

  constructor(
    ns: TashmetCollectionNamespace,
    public documents: Document[] = [],
    private validator: Validator | undefined,
  ) {
    super(ns);
    for (let i = 0; i < documents.length; i++) {
      this.indexes.set(documents[i]._id, i);
    }
  }

  async* read(options: ReadOptions) {
    if (options?.documentIds) {
      for (const id of options.documentIds) {
        if (this.exists(id)) {
          yield this.documents[this.indexes.get(hash(id)) || 0];
        }
      }
    } else {
      for (const doc of this.documents) {
        yield doc;
      }
    }
  }

  exists(id: string | Object): boolean {
    return this.indexes.has(hash(id));
  }

  async insert(document: Document, validate: boolean): Promise<void> {
    if (validate && this.validator) {
      await this.validator(document);
    }
    if (this.exists(document._id)) {
      throw new Error('Duplicate id');
    }

    this.documents.push(document);
    this.indexes.set(hash(document._id), this.documents.length - 1);
  }

  async delete(id: string): Promise<void> {
    const index = this.indexes.get(hash(id));

    if (index !== undefined) {
      this.documents.splice(index, 1);
      this.indexes.delete(hash(id));
      for (const [k, v] of this.indexes) {
        if (v > index) {
          this.indexes.set(k, v - 1);
        }
      }
    }
  }

  async replace(id: string, document: Document): Promise<void> {
    const index = this.indexes.get(hash(id));

    if (index !== undefined) {
      this.documents.splice(index, 1, document);
    }
  }
}

@provider()
export class MemoryCollectionFactory extends CollectionFactory {
  constructor(private validatorFactory: ValidatorFactory) { super(); }

  createCollection(ns: TashmetCollectionNamespace, options: CreateCollectionOptions): ReadWriteCollection {
    const validator = options.validator
      ? this.validatorFactory.createValidator(options.validator)
      : undefined;
    return new MemoryCollection(ns, [], validator);
  }
}


@provider()
export default class Memory extends StorageEngine {
  private commandRunner: CommandRunner;

  constructor(
    private engine: AggregationEngine,
    private store: Store,
    private collectionFactory: CollectionFactory,
  ) {
    super();
    const views: ViewMap = {};
    this.commandRunner = CommandRunner.fromControllers(
      new AdminController(store, collectionFactory, views),
      new AggregationReadController(this.engine, views),
      new AggregationWriteController(store, this.engine)
    );
    this.store.on('change', doc => this.emit('change', doc));
  }

  static configure(config: Partial<BootstrapConfig>) {
    return new MemoryConfigurator(Memory, createContainer({logLevel: LogLevel.None, ...config}));
  }

  async command(ns: TashmetNamespace, command: Document): Promise<Document> {
    await this.initNamespace(ns);

    return this.commandRunner.command(ns, command);
  }

  private async initNamespace(ns: TashmetNamespace) {
    const systemNs = ns.withCollection('system.collections');

    if (!this.store.hasCollection(systemNs)) {
      const coll = this.collectionFactory.createCollection(systemNs, {});
      this.store.addCollection(coll);

      for await (const doc of coll.read()) {
        const { _id, ...options } = doc;
        await this.command(ns, { create: _id, ...options });
      }
    }
  }
}

export class MemoryConfigurator extends PluginConfigurator<Memory> {
  register() {
    this.container.register(Memory);
    this.container.register(AggregationEngine);
    this.container.register(QueryPlanner);
    this.container.register(MemoryCollectionFactory);
    this.container.register(Provider.ofResolver(CollectionFactory, Lookup.of(MemoryCollectionFactory)));

    if (!this.container.isRegistered(Store)) {
      this.container.register(Store);
    }
  }
}
