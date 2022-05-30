import { MemoryStorageEngine } from './storageEngine';
import { $aggregate } from './commands/aggregate';
import { $count } from './commands/count';
import { $create } from './commands/create';
import { $delete } from './commands/delete';
import { $distinct } from './commands/distinct';
import { $drop } from './commands/drop';
import { $find } from './commands/find';
import { $getMore } from './commands/getMore';
import { $insert } from './commands/insert';
import { $update } from './commands/update';
import { AbstractAggregator, AggregatorFactory, DatabaseEngine, Document, MingoConfig, StorageEngine } from './interfaces';
import { BufferAggregator } from './aggregator';

export class MingoAggregatorFactory implements AggregatorFactory {
  public constructor(private collectionResolver: (collection: string) => Document[]) {}

  public createAggregator(pipeline: Document[], options: any): AbstractAggregator<Document> {
    return new BufferAggregator(pipeline, {collectionResolver: this.collectionResolver, ...options});
  }
}

export class MingoDatabaseEngine extends DatabaseEngine {
  public static inMemory(databaseName: string, config: Partial<MingoConfig> = {}) {
    const storage = new MemoryStorageEngine(databaseName); 
    const aggFact = new MingoAggregatorFactory(coll => storage.resolve(coll));
    return new MingoDatabaseEngine(storage, aggFact, config);
  }

  public constructor(
    store: StorageEngine,
    aggFact: AggregatorFactory,
    options: MingoConfig = {}
  ) {
    super(store, aggFact, {
      $aggregate, $count, $create, $delete, $distinct, $drop, $find, $getMore, $insert, $update,
    });
  }
}
