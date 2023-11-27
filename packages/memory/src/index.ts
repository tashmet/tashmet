import {
  provider,
  Optional,
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
  AtomicWriteCollection
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
    public readonly rules: Document = {},
    private readonly validatorFact: ValidatorFactory | undefined,
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
    if (this.rules && this.validatorFact && validate) {
      const validator = this.validatorFact.createValidator(this.rules);
      await validator(document);
    }
    if (await this.exists(document._id)) {
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

@provider({
  inject: [Optional.of(ValidatorFactory)]
})
export class MemoryCollectionFactory extends CollectionFactory {
  constructor(public validatorFactory?: ValidatorFactory) { super(); }

  createCollection(ns: TashmetCollectionNamespace, options: CreateCollectionOptions): ReadWriteCollection {
    return new MemoryCollection(ns, [], options.validator || {}, this.validatorFactory);
  }
}


@provider()
export default class Memory extends StorageEngine {
  private commandRunner: CommandRunner;

  constructor(
    private engine: AggregationEngine,
    private store: Store,
    collectionFactory: CollectionFactory,
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

  command(ns: TashmetNamespace, command: Document): Promise<Document> {
    return this.commandRunner.command(ns, command);
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
